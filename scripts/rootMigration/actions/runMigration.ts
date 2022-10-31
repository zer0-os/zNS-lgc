// import { ethers } from "hardhat";
import * as hre from "hardhat"
import {
  MigrationRegistrar,
  MigrationRegistrar__factory,
  Registrar__factory,
  ZNSHub__factory,
} from "../../../typechain";
import { getAddressesForNetwork } from "./addresses";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getLogger } from "../../../utilities";
import * as helpers from "./helpers";

const logger = getLogger("scripts::runTestNetwork");

export const runMigration = async (
  signer: SignerWithAddress,
  network: string
) => {
  const signerAddress = await signer.getAddress();
  const addresses = getAddressesForNetwork(network);

  logger.log(`Using network ${network} for migration`);

  let legacyRegistrarAddress;
  let zNSHubAddress;
  let beaconAddress;
  let wilderDomainId;

  const rootDomainId = "0";
  const waitBlocks = network === "hardhat" ? 0 : 3;

  if (network === "hardhat") {
    // Setup default contracts required for migration simulation
    const [zNSHub, legacyRegistrar, beacon] = await helpers.deployContracts();

    await zNSHub.addRegistrar(hre.ethers.constants.HashZero, legacyRegistrar.address);
    await legacyRegistrar.connect(signer).addController(signerAddress);

    legacyRegistrarAddress = legacyRegistrar.address;
    zNSHubAddress = zNSHub.address;
    beaconAddress = beacon.address;

    wilderDomainId = await helpers.mintSampleWilderDomain(signer, legacyRegistrar);
  } else {
    legacyRegistrarAddress = addresses.registrar;
    zNSHubAddress = addresses.zNSHub;
    beaconAddress = addresses.subregistrarBeacon;
    wilderDomainId = addresses.wilderDomainId;
  }

  const zNSHub = ZNSHub__factory.connect(zNSHubAddress, signer);

  logger.log("2. Upgrade existing proxies to have needed functionality");

  logger.log("2.a. Upgrade legacy Registrar");
  const upgradeRegistrarTx = await hre.upgrades.upgradeProxy(
    legacyRegistrarAddress,
    new MigrationRegistrar__factory(signer)
  );
  const upgradedLegacyRegistrar = await upgradeRegistrarTx.deployed() as MigrationRegistrar;

  logger.log("2.b. Upgrade Beacon registrars");
  const upgradeBeaconTx = await hre.upgrades.upgradeBeacon(
    beaconAddress,
    new MigrationRegistrar__factory(signer)
  );
  const upgradedBeacon = await upgradeBeaconTx.deployed() as MigrationRegistrar;

  logger.log("3. Burn root and wilder domains on legacy registrar");
  const burnWilderTx = await upgradedLegacyRegistrar.connect(signer).burnDomain(wilderDomainId);
  await burnWilderTx.wait(waitBlocks);

  const burnRootTx = await upgradedLegacyRegistrar.connect(signer).burnDomain(rootDomainId);
  await burnRootTx.wait(waitBlocks);

  logger.log("Verify burn");
  const wilderDomainExists = await upgradedLegacyRegistrar.domainExists(wilderDomainId);
  const rootDomainExists = await upgradedLegacyRegistrar.domainExists(rootDomainId);

  if (wilderDomainExists || rootDomainExists) {
    throw Error("Burn didn't work");
  }

  logger.log("4. Deploy new root registrar as proxy to existing subdomain registrar beacon");
  const newRegistrarTx = await hre.upgrades.deployBeaconProxy(
    upgradedBeacon.address,
    new MigrationRegistrar__factory(signer),
    [
      hre.ethers.constants.AddressZero, // Parent registrar
      rootDomainId,
      "Zer0 Namespace Service",
      "ZNS",
      zNSHub.address
    ]
  );

  const beaconRegistrar = await newRegistrarTx.deployed() as MigrationRegistrar;

  logger.log(`New Beacon Registrar Address: ${beaconRegistrar.address}`);

  // Must do this to be able to mint below
  await zNSHub.addRegistrar(rootDomainId, beaconRegistrar.address);

  logger.log("5. Mint wilder in new root registrar");
  const tx = await beaconRegistrar.connect(signer).mintDomain(
    hre.ethers.constants.HashZero, // parent id
    "wilder",
    signerAddress,
    "ipfs://QmSQTLzzsPS67ay4SFKMv9Dq57iSQ7pLWQVUvS3XB5MowK/0",
    0,
    false,
    beaconRegistrar.address
  );

  const newWilderDomainId = await helpers.getDomainId(tx, waitBlocks);

  logger.log(`New Wilder domainId: ${newWilderDomainId.toHexString()}`);

  logger.log("6. Update the rootDomainId and parentRegistrar values on upgraded legacy");
  await helpers.updateRegistrarValues(
    signer,
    upgradedLegacyRegistrar,
    rootDomainId,
    beaconRegistrar.address,
    waitBlocks
  );

  logger.log("7. Upgrade to legacy and beacon registrars to post-migration version (OG version)");
  logger.log("7a. Upgrade legacy registrar back to original Registrar");
  await hre.upgrades.upgradeProxy(
    upgradedLegacyRegistrar,
    new Registrar__factory(signer)
  );

  logger.log("7b. Upgrade beacon registrars to original Registrar");
  await hre.upgrades.upgradeBeacon(
    upgradedBeacon.address,
    new Registrar__factory(signer)
  );

  return;
}
