import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import * as hre from "hardhat";
import { ethers } from "hardhat";
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
 *  upgrade to OG registrars for default and beacon
 */

describe("Verify entire migration scenario", () => {
  let accounts: SignerWithAddress[];

  let registrarFactory: Registrar__factory;
  let registrar: Registrar;
  let migrationRegistrarFactory: MigrationRegistrar__factory;
  let migrationRegistrar: MigrationRegistrar;
  let hubFactory: ZNSHub__factory;
  let hub: ZNSHub;

  let signer: SignerWithAddress;

  let addresses = getAddressesForNetwork(hre.network.name);
  const astroAddress = "0x35888AD3f1C0b39244Bb54746B96Ee84A5d97a53"

  // Effects from goerli
  let defaultRegistrar: MigrationRegistrar;
  let subdomainRegistrar: MigrationRegistrar;

  before(async () => {
    accounts = await hre.ethers.getSigners(); // needed?

    // Registrar owner is the gnosis safe
    signer = await ethers.getImpersonatedSigner(addresses.registrarOwner);

    migrationRegistrarFactory = new MigrationRegistrar__factory(signer);

    // registrarFactory = new Registrar__factory(signer);
    // registrar = registrarFactory.attach(addresses.registrar);

    // hubFactory = new ZNSHub__factory(signer);
    // hub = hubFactory.attach(addresses.zNSHub);
  });
  it("2. Upgrades the wild and subdomain registrars", async () => {
    // 2.a. Upgrade default Registrar
    defaultRegistrar = await hre.upgrades.upgradeProxy(
      addresses.registrar,
      migrationRegistrarFactory,
    ) as MigrationRegistrar;
    await defaultRegistrar.deployed();

    expect(defaultRegistrar.functions.burnDomains).to.not.be.undefined;

    // 2.b. Upgrade subdomain Registrar
    subdomainRegistrar = await hre.upgrades.upgradeBeacon(
      addresses.subregistrarBeacon,
      migrationRegistrarFactory
    ) as MigrationRegistrar;
    await subdomainRegistrar.deployed();

    const implAddress = await hre.upgrades.beacon.getImplementationAddress(subdomainRegistrar.address);
    const impl = migrationRegistrarFactory.attach(implAddress);

    expect(impl.functions.burnDomains).to.not.be.undefined;
  });
  it("3. Burn root and wilder domains on default registrar", async () => {
    // Goerli owner of
    // rootDomain: astro
    // wilderDomain: astro

    // Mainnet owner of:
    // rootDomain: 0x7829Afa127494Ca8b4ceEF4fb81B78fEE9d0e471
    // wilderDomain: 0x6aD1b4d3C39939F978Ea5cBaEaAD725f9342089C

    // A: transfer ownership of domains to gnosis safe
    // B: Modify migration registrar code to also take owner addresses

    const tx = await defaultRegistrar.connect(signer).burnDomains(
      addresses.wilderDomainId,
      "0",
      astroAddress,
      astroAddress
    );
    await tx.wait();

    const wilderExists = await defaultRegistrar.domainExists(addresses.wilderDomainId);
    expect(wilderExists).to.be.false;

    const rootExists = await defaultRegistrar.domainExists("0");
    expect(rootExists).to.be.false;
  })
});
