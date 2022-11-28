import * as hre from "hardhat";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import {
  MigrationRegistrar,
  MigrationRegistrar__factory,
  Registrar__factory,
  ZNSHub__factory,
} from "../../../typechain";
import { getAddressesForNetwork } from "./addresses";
import { getLogger } from "../../../utilities";

const logger = getLogger("scripts::runMigration");

const confirmContinue = () => {
  let input = require('cli-interact').getYesNo;
  let val: boolean = input(`Proceed?`);

  if (!val) {
    throw Error("Did not continue");
  }
}

export const runMigration = async (
  signer: SignerWithAddress,
  network: string
) => {
  const signerAddress = await signer.getAddress();
  const addresses = getAddressesForNetwork(network);

  logger.log(`Using network ${network} for migration`);

  const rootDomainId = "0";
  const waitBlocks = network === "hardhat" ? 0 : 3;

  const legacyRegistrarAddress = addresses.registrar;
  const legacyRegistrarOwner = addresses.registrarOwner;
  const zNSHubAddress = addresses.zNSHub;
  const beaconAddress = addresses.subregistrarBeacon;
  const wilderDomainId = addresses.wilderDomainId;

  // The address for the legacy registrar is not in the manifest we must force
  // hardhat to use it to be able to allow us to upgrade it.
  if (network === "hardhat") {
    await hre.upgrades.forceImport(legacyRegistrarAddress, new Registrar__factory());
  }

  const zNSHub = ZNSHub__factory.connect(zNSHubAddress, signer);

  logger.log("Comparing bytecode of Registrar and MigrationRegistrar for compatibility");
  logger.log(`Registrar Bytecode: ${new Registrar__factory(signer).bytecode.length / 2}`);
  logger.log(`MigrationRegistrar Bytecode: ${new MigrationRegistrar__factory(signer).bytecode.length / 2}`);

  logger.log("2. Upgrade existing proxies to have needed functionality");

  logger.log("2.a. Upgrade legacy Registrar");
  confirmContinue();
  const upgradeRegistrarTx = await hre.upgrades.upgradeProxy(
    legacyRegistrarAddress,
    new MigrationRegistrar__factory(signer)
  );
  const upgradedLegacyRegistrar = await upgradeRegistrarTx.deployed() as MigrationRegistrar;

  logger.log("2.b. Upgrade Beacon registrars");
  confirmContinue();
  const upgradeBeaconTx = await hre.upgrades.upgradeBeacon(
    beaconAddress,
    new MigrationRegistrar__factory(signer)
  );
  // Beacon is the subdomain contract for wolf
  const upgradedLegacyRegistrarBeacon = await upgradeBeaconTx.deployed() as MigrationRegistrar;

  logger.log("3. Burn root and wilder domains on legacy registrar");
  confirmContinue();
  const burnDomainsTx = await upgradedLegacyRegistrar.connect(signer).burnDomains(wilderDomainId, rootDomainId);
  await burnDomainsTx.wait(waitBlocks);

  logger.log("Verify burn...");
  const wilderDomainExists = await upgradedLegacyRegistrar.domainExists(wilderDomainId);
  const rootDomainExists = await upgradedLegacyRegistrar.domainExists(rootDomainId);

  if (wilderDomainExists || rootDomainExists) {
    throw Error("Burn didn't work");
  }
  logger.log("Burn succeeded");

  logger.log("4. Deploy new root registrar as proxy to existing subdomain registrar beacon");
  confirmContinue();
  const newRegistrarTx = await hre.upgrades.deployBeaconProxy(
    upgradedLegacyRegistrarBeacon.address,
    new MigrationRegistrar__factory(signer),
    [
      hre.ethers.constants.AddressZero, // Parent registrar
      rootDomainId,
      "Zer0 Namespace Service",
      "ZNS",
      zNSHub.address
    ]
  );

  const newBeaconRegistrar = await newRegistrarTx.deployed() as MigrationRegistrar;

  logger.log(`New Beacon Registrar Address: ${newBeaconRegistrar.address}`);

  logger.log("Register the new Beacon Registrar on zNSHub")
  confirmContinue();
  // Must call zNSHub.addRegistrar for the newBeaconRegistrar to mint below
  const addRegistrarTx = await zNSHub.addRegistrar(rootDomainId, newBeaconRegistrar.address);
  await addRegistrarTx.wait(waitBlocks);

  logger.log("5. Mint wilder in new root registrar");
  confirmContinue();
  const tx = await newBeaconRegistrar.connect(signer).mintDomain(
    hre.ethers.constants.HashZero, // Parent domainId
    "wilder",
    signerAddress,
    "ipfs://QmSQTLzzsPS67ay4SFKMv9Dq57iSQ7pLWQVUvS3XB5MowK/0",
    0,
    false,
    newBeaconRegistrar.address
  );
  const receipt = await tx.wait(waitBlocks);

  const newWilderDomainId = BigNumber.from(receipt.events![0].args!["tokenId"]);

  logger.log("Verify mint...");
  const newWilderDomainExists = await newBeaconRegistrar.domainExists(newWilderDomainId);

  if (!newWilderDomainExists) {
    throw Error("Mint didn't work");
  }
  logger.log("Mint succeeded");

  if (wilderDomainId !== newWilderDomainId.toHexString()) {
    throw Error(
      `Original wilderDomainId: ${wilderDomainId} and minted newWilderDomainId ${newWilderDomainId.toHexString()} do not match.`
    );
  }

  logger.log(`New Wilder domainId: ${newWilderDomainId.toHexString()}`);

  logger.log("6. Update the rootDomainId and parentRegistrar values on upgraded legacy registrar");
  confirmContinue();
  const updateValuesTx = await upgradedLegacyRegistrar.connect(signer)
    .setRootDomainIdAndParentRegistrar(
      rootDomainId,
      newBeaconRegistrar.address
    );
  await updateValuesTx.wait(waitBlocks);

  const rootDomainIdAfterUpdate = await upgradedLegacyRegistrar.rootDomainId();
  const parentRegistrarAfterUpdate = await upgradedLegacyRegistrar.parentRegistrar();


  if (
    rootDomainIdAfterUpdate.toString() !== rootDomainId ||
    parentRegistrarAfterUpdate !== newBeaconRegistrar.address
  ) {
    const rootsMessage = `${rootDomainIdAfterUpdate.toString()} - ${rootDomainId}`
    const parentRegistrarMessage = `${parentRegistrarAfterUpdate} - ${newBeaconRegistrar.address}`
    const message = `Values after updating don't match their expected value.\n${rootsMessage}\n${parentRegistrarMessage}`
    throw Error(message)
  }

  logger.log("7. Upgrade legacy and beacon registrars back to post-migration version (OG version)");
  logger.log("7a. Upgrade legacy registrar back to original Registrar");
  confirmContinue();
  const originalRegistrarTx = await hre.upgrades.upgradeProxy(
    upgradedLegacyRegistrar,
    new Registrar__factory(signer)
  );
  await originalRegistrarTx.deployed()

  logger.log("7b. Upgrade beacon registrars to original Registrar");
  confirmContinue();
  const originalBeaconRegistrarTx = await hre.upgrades.upgradeBeacon(
    upgradedLegacyRegistrarBeacon.address,
    new Registrar__factory(signer)
  );
  await originalBeaconRegistrarTx.deployed();

  return;
}
