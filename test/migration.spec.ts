import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import * as hre from "hardhat";
import {
  Registrar,
  ZNSHub,
  ZNSHub__factory,
  Registrar__factory,
  MigrationRegistrar__factory,
  MigrationRegistrar,
} from "../typechain";
import chai from "chai";

import { getAddressesForNetwork } from "../scripts/rootMigration/actions/addresses";

import { setBalance } from "@nomicfoundation/hardhat-network-helpers";

const { expect } = chai;

// create a test that runs through the entire migration process
// to validate expected behavior, use EOA
/**
 * 
 * Steps
 *  deploy registrar
 *  mint several nfts, at several different levels
 *  upgrade registrar
 *  burn root and wilder
 *  confirm burn
 *  deploy new registrar as beacon proxy
 *  mint wilder on new beacon proxu
 *  call existing registrars function to update root domain ID and parent registrar vals
 *  upgrade to original registrars for default and beacon
 */

describe("Verify entire migration scenario", () => {
  let accounts: SignerWithAddress[];

  let registrarFactory: Registrar__factory;
  let migrationRegistrarFactory: MigrationRegistrar__factory;
  let hubFactory: ZNSHub__factory;
  let hub: ZNSHub;

  let signer: SignerWithAddress;

  let addresses = getAddressesForNetwork(hre.network.name);

  // Contracts we interact with in the migration
  let defaultRegistrar: MigrationRegistrar;
  let subregistrarBeacon: MigrationRegistrar;
  let rootRegistrar: MigrationRegistrar;

  before(async () => {
    accounts = await hre.ethers.getSigners(); // needed?

    // Registrar owner is the gnosis safe
    signer = await hre.ethers.getImpersonatedSigner(addresses.registrarOwner);
    await setBalance(signer.address, hre.ethers.BigNumber.from("10000000000000000000000").toHexString())

    migrationRegistrarFactory = new MigrationRegistrar__factory(signer);

    registrarFactory = new Registrar__factory(signer);

    hubFactory = new ZNSHub__factory(signer);
    hub = hubFactory.attach(addresses.zNSHub);
  });
  it("2. Upgrades the wild and subdomain registrars", async () => {

    // The proxy for the registrar does not have it's implementation registered in the manifest.
    await hre.upgrades.forceImport(addresses.registrar, registrarFactory)

    // 2a. Upgrade default Registrar
    defaultRegistrar = await hre.upgrades.upgradeProxy(
      addresses.registrar,
      migrationRegistrarFactory,
    ) as MigrationRegistrar;
    await defaultRegistrar.deployed();

    expect(defaultRegistrar.functions.burnDomains).to.exist;

    // 2b. Upgrade subdomain Registrar
    subregistrarBeacon = await hre.upgrades.upgradeBeacon(
      addresses.subdomainBeacon,
      migrationRegistrarFactory
    ) as MigrationRegistrar;
    await subregistrarBeacon.deployed();

    const implAddress = await hre.upgrades.beacon.getImplementationAddress(subregistrarBeacon.address);

    const impl = migrationRegistrarFactory.attach(implAddress);

    const initTx = await impl.connect(signer).initialize(
      hre.ethers.constants.AddressZero,
      addresses.rootDomainId,
      "Zero Name Service",
      "ZNS",
      hub.address
    );
    await initTx.wait()

    const registerTx = await hub.addRegistrar(addresses.rootDomainId, implAddress);
    await registerTx.wait();

    const mintTx1 = await impl.connect(signer).mintDomain(addresses.rootDomainId, "tester", signer.address, "ipfs://Qm", 0, false, hre.ethers.constants.AddressZero);
    const receipt1 = await mintTx1.wait();
    const testerId = hre.ethers.BigNumber.from(receipt1.events![0].args!["tokenId"]);

    const mintTx2 = await impl.connect(signer).mintDomain(addresses.rootDomainId, "zester", signer.address, "ipfs://Qm", 0, false, hre.ethers.constants.AddressZero);
    const receipt2 = await mintTx2.wait();
    const zesterId = hre.ethers.BigNumber.from(receipt2.events![0].args!["tokenId"]);

    const burnTx = await impl.burnDomains(testerId, zesterId, signer.address, signer.address);
    await burnTx.wait()

    const testerExists = await impl.domainExists(testerId);
    const zesterExists = await impl.domainExists(zesterId);

    expect(testerExists).to.be.false;
    expect(zesterExists).to.be.false;
  });
  it("3. Burn root and wilder domains on default registrar", async () => {
    const tx = await defaultRegistrar.connect(signer).burnDomains(
      addresses.wilderDomainId,
      addresses.rootDomainId,
      addresses.wilderDomainOwner,
      addresses.rootDomainOwner
    );
    await tx.wait();

    // Verify the burn
    const wilderExists = await defaultRegistrar.domainExists(addresses.wilderDomainId);
    expect(wilderExists).to.be.false;

    const rootExists = await defaultRegistrar.domainExists("0");
    expect(rootExists).to.be.false;
  });
  it("4. Deploy new root registrar as beacon proxy to existing subdomain beacon", async () => {
    rootRegistrar = await hre.upgrades.deployBeaconProxy(
      addresses.subdomainBeacon,
      migrationRegistrarFactory,
      [
        hre.ethers.constants.AddressZero, // Parent registrar
        addresses.rootDomainId,
        "Zero Name Service",
        "zNS",
        hub.address
      ]) as MigrationRegistrar;

    await rootRegistrar.deployed();

    // Must register the new Registrar on zNSHub in order to mint below.
    const tx = await hub.connect(signer).addRegistrar(hre.ethers.constants.HashZero, rootRegistrar.address);
    await tx.wait();

    const authorizedRegistrar = await hub.authorizedRegistrars(rootRegistrar.address);
    expect(authorizedRegistrar).to.be.true;
  });
  it("5. Mint wilder domain in new root registrar", async () => {
    const tx = await rootRegistrar.connect(signer).mintDomain(
      hre.ethers.constants.HashZero, // Parent domainId
      "wilder",
      signer.address, // minter
      "ipfs://QmSQTLzzsPS67ay4SFKMv9Dq57iSQ7pLWQVUvS3XB5MowK/0",
      0,
      false,
      addresses.registrar,
      {
        gasLimit: 9000000
      }
    );

    const receipt = await tx.wait();
    const newWilderId = hre.ethers.BigNumber.from(receipt.events![0].args!["tokenId"]);

    // Verify the address is the same to confirm no domain hierarchy is broken
    expect(newWilderId.toString()).to.eq(addresses.wilderDomainId);
  });
  it("6. Update the rootDomainId and parentRegistrar values on default registrar", async () => {
    const tx = await defaultRegistrar.connect(signer).setRootDomainIdAndParentRegistrar(
      hre.ethers.constants.HashZero,
      rootRegistrar.address
    );
    await tx.wait();

    const rootDomainIdAfterUpdate = await defaultRegistrar.rootDomainId();
    const parentRegistrarAfterUpdate = await defaultRegistrar.parentRegistrar();

    expect(rootDomainIdAfterUpdate.toString()).to.eq(addresses.rootDomainId);
    expect(parentRegistrarAfterUpdate.toString()).to.eq(rootRegistrar.address);
  });
  it("7. Upgrade registrars back to original version, post-migration", async () => {
    // 7a. Upgrade default registrar back to original version
    const originalDefaultRegistrar = await hre.upgrades.upgradeProxy(addresses.registrar, registrarFactory) as Registrar;
    await originalDefaultRegistrar.deployed();

    const originalSubdomainRegistrar = await hre.upgrades.upgradeBeacon(addresses.subdomainBeacon, registrarFactory) as Registrar;
    await originalSubdomainRegistrar.deployed();

    expect(originalDefaultRegistrar.functions).to.not.include(["burnDomains(uint256,uint256)"]);
    expect(originalSubdomainRegistrar.functions).to.not.include(["burnDomains(uint256,uint256)"]);
  });
});