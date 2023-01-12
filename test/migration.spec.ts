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
  const astroAddress = "0x35888AD3f1C0b39244Bb54746B96Ee84A5d97a53"
  const rootDomainId = "0"

  // Effects from goerli
  let defaultRegistrar: MigrationRegistrar;
  let subdomainRegistrar: MigrationRegistrar;
  let rootRegistrar: MigrationRegistrar; // could just be regular registrar

  before(async () => {
    accounts = await hre.ethers.getSigners(); // needed?

    // Registrar owner is the gnosis safe
    signer = await hre.ethers.getImpersonatedSigner(addresses.registrarOwner);

    migrationRegistrarFactory = new MigrationRegistrar__factory(signer);

    registrarFactory = new Registrar__factory(signer);
    // registrar = registrarFactory.attach(addresses.registrar);

    hubFactory = new ZNSHub__factory(signer);
    hub = hubFactory.attach(addresses.zNSHub);
  });
  it("2. Upgrades the wild and subdomain registrars", async () => {
    // 2.a. Upgrade default Registrar
    defaultRegistrar = await hre.upgrades.upgradeProxy(
      addresses.registrar,
      migrationRegistrarFactory,
    ) as MigrationRegistrar;
    await defaultRegistrar.deployed();

    expect(defaultRegistrar.functions.burnDomains).to.exist;

    // 2.b. Upgrade subdomain Registrar
    subdomainRegistrar = await hre.upgrades.upgradeBeacon(
      addresses.subregistrarBeacon,
      migrationRegistrarFactory
    ) as MigrationRegistrar;
    await subdomainRegistrar.deployed();

    const implAddress = await hre.upgrades.beacon.getImplementationAddress(subdomainRegistrar.address);
    const impl = migrationRegistrarFactory.attach(implAddress);

    expect(impl.functions.burnDomains).to.exist;
  });
  it("3. Burn root and wilder domains on default registrar", async () => {
    // Goerli owner of
    // rootDomain: astro
    // wilderDomain: astro

    // Mainnet owner of:
    // rootDomain: 0x7829Afa127494Ca8b4ceEF4fb81B78fEE9d0e471
    // wilderDomain: 0x6aD1b4d3C39939F978Ea5cBaEaAD725f9342089C

    // A: transfer ownership of domains to gnosis safe                  [ ]
    // B: Modify migration registrar code to also take owner addresses  [X]

    const tx = await defaultRegistrar.connect(signer).burnDomains(
      addresses.wilderDomainId,
      rootDomainId,
      astroAddress,
      astroAddress
    );
    await tx.wait();

    const wilderExists = await defaultRegistrar.domainExists(addresses.wilderDomainId);
    expect(wilderExists).to.be.false;

    const rootExists = await defaultRegistrar.domainExists("0");
    expect(rootExists).to.be.false;
  });
  it("4. Deploy new root registrar as beacon proxy to existing subdomain beacon", async () => {
    rootRegistrar = await hre.upgrades.deployBeaconProxy(
      addresses.subregistrarBeacon,
      migrationRegistrarFactory,
      [
        hre.ethers.constants.AddressZero, // Parent registrar
        hre.ethers.constants.HashZero, // root domain
        "Zer0 Namespace Service",
        "ZNS",
        hub.address
      ]) as MigrationRegistrar;

    await rootRegistrar.deployed();

    // Must register the new Registrar on zNSHub in order to mint below.
    const tx = await hub.connect(signer).addRegistrar(hre.ethers.constants.HashZero, rootRegistrar.address);
    await tx.wait();
  });
  it("5. Mint wilder domain in new root registrar", async () => {
    const tx = await rootRegistrar.connect(signer).mintDomain(
      hre.ethers.constants.HashZero, // Parent domainId
      "wilder",
      signer.address,
      "ipfs://QmSQTLzzsPS67ay4SFKMv9Dq57iSQ7pLWQVUvS3XB5MowK/0",
      0,
      false,
      addresses.registrar
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

    expect(rootDomainIdAfterUpdate.toString()).to.eq(rootDomainId);
    expect(parentRegistrarAfterUpdate.toString()).to.eq(rootRegistrar.address);
  });
  it("7. Upgrade registrars back to original version, post-migration", async () => {
    // 7a. Upgrade default registrar back to original version
    const originalDefaultRegistrar = await hre.upgrades.upgradeProxy(addresses.registrar, registrarFactory) as Registrar;
    await originalDefaultRegistrar.deployed();

    const originalSubdomainRegistrar = await hre.upgrades.upgradeBeacon(addresses.subregistrarBeacon, registrarFactory) as Registrar;
    await originalSubdomainRegistrar.deployed();

    expect(originalDefaultRegistrar.functions).to.not.include(["burnDomains(uint256,uint256)"]);
    expect(originalSubdomainRegistrar.functions).to.not.include(["burnDomains(uint256,uint256)"]);
  });
});