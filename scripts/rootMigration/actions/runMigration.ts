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
import { exit } from "process";

const logger = getLogger("scripts::runMigration");

const confirmContinue = () => {
  let input = require('cli-interact').getYesNo;
  let val: boolean = input(`Proceed?`);

  if (!val) {
    exit();
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
  const zNSHubAddress = addresses.zNSHub;
  const beaconAddress = addresses.subregistrarBeacon;
  const wilderDomainId = addresses.wilderDomainId;

  // The address for the legacy registrar is not in the manifest so we must force
  // hardhat to be able to allow us to upgrade it.
  if (network === "hardhat") {
    await hre.upgrades.forceImport(legacyRegistrarAddress, new Registrar__factory());
  }
  const astroAddress = "0x35888AD3f1C0b39244Bb54746B96Ee84A5d97a53"

  const zNSHub = ZNSHub__factory.connect(zNSHubAddress, signer);

  logger.log("Comparing bytecode of Registrar and MigrationRegistrar for compatibility");
  logger.log(`Registrar Bytecode: ${new Registrar__factory(signer).bytecode.length / 2}`);
  logger.log(`MigrationRegistrar Bytecode: ${new MigrationRegistrar__factory(signer).bytecode.length / 2}`);

  logger.log("2. Upgrade existing proxies to have needed functionality");

  logger.log("2.a. Upgrade legacy Registrar");

  confirmContinue();
  const wildRegistrar = await hre.upgrades.upgradeProxy(
    legacyRegistrarAddress,
    new MigrationRegistrar__factory(signer)
  ) as MigrationRegistrar;
  await wildRegistrar.deployTransaction.wait(waitBlocks);

  logger.log("2.b. Upgrade Beacon Registrars");

  confirmContinue();
  const subdomainRegistrar = await hre.upgrades.upgradeBeacon(
    beaconAddress,
    new MigrationRegistrar__factory(signer)
  );
  await subdomainRegistrar.deployTransaction.wait(waitBlocks);

  logger.log("3. Burn root and wilder domains on legacy registrar");

  confirmContinue();
  // Mainnet owner of:
  // rootDomain: 0x7829Afa127494Ca8b4ceEF4fb81B78fEE9d0e471
  // wilderDomain: 0x6aD1b4d3C39939F978Ea5cBaEaAD725f9342089C

  // A: transfer ownership of domains to gnosis safe
  // B: Modify migration registrar code to also take owner addresses
  const burnDomains = await wildRegistrar.connect(signer).burnDomains(wilderDomainId, rootDomainId, astroAddress, astroAddress);
  await burnDomains.wait(waitBlocks);

  logger.log("Verify burn...");
  const wilderDomainExists = await wildRegistrar.domainExists(wilderDomainId);
  const rootDomainExists = await wildRegistrar.domainExists(rootDomainId);

  if (wilderDomainExists || rootDomainExists) {
    throw Error("Burn didn't work");
  }
  logger.log("Burn succeeded");

  logger.log("4. Deploy new root registrar as proxy to existing subdomain registrar beacon");
  confirmContinue();
  const rootRegistrar = await hre.upgrades.deployBeaconProxy(
    beaconAddress,
    new MigrationRegistrar__factory(signer),
    [
      hre.ethers.constants.AddressZero, // Parent registrar
      rootDomainId,
      "Zer0 Namespace Service",
      "ZNS",
      zNSHub.address
    ]
  ) as MigrationRegistrar;
  await rootRegistrar.deployTransaction.wait(waitBlocks);

  logger.log(`New Root Registrar Address: ${rootRegistrar.address}`);

  // Must call zNSHub.addRegistrar for the newBeaconRegistrar to mint below
  logger.log("Register the new Registrar on zNSHub")
  confirmContinue();
  const addRegistrar = await zNSHub.addRegistrar(rootDomainId, rootRegistrar.address);
  await addRegistrar.wait(waitBlocks);

  logger.log("5. Mint wilder in new root registrar");
  confirmContinue();
  const mintWilderDomainTx = await rootRegistrar.connect(signer).mintDomain(
    hre.ethers.constants.HashZero, // Parent domainId
    "wilder",
    signerAddress,
    "ipfs://QmSQTLzzsPS67ay4SFKMv9Dq57iSQ7pLWQVUvS3XB5MowK/0",
    0,
    false,
    legacyRegistrarAddress
  );

  const receipt = await mintWilderDomainTx.wait(waitBlocks);
  const newWilderDomainId = BigNumber.from(receipt.events![0].args!["tokenId"]);

  logger.log("Verify mint...");
  const newWilderDomainExists = await rootRegistrar.domainExists(newWilderDomainId);
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

  logger.log("6. Update the rootDomainId and parentRegistrar values on legacy registrar");
  confirmContinue();
  const updateValuesTx = await wildRegistrar.connect(signer)
    .setRootDomainIdAndParentRegistrar(
      rootDomainId,
      rootRegistrar.address
    );
  await updateValuesTx.wait(waitBlocks);

  const rootDomainIdAfterUpdate = await wildRegistrar.rootDomainId();
  const parentRegistrarAfterUpdate = await wildRegistrar.parentRegistrar();

  if (
    rootDomainIdAfterUpdate.toString() !== rootDomainId ||
    parentRegistrarAfterUpdate !== rootRegistrar.address
  ) {
    const rootIds = `${rootDomainIdAfterUpdate.toString()} :: ${rootDomainId}`;
    const parentRegistrars = `${parentRegistrarAfterUpdate} :: ${rootRegistrar.address}`;
    throw Error(`Values after updating don't match their expected value.\n${rootIds}\n${parentRegistrars}`);
  }

  logger.log("7. Upgrade legacy and beacon registrars back to post-migration version (original registrar)");
  logger.log("7a. Upgrade legacy registrar back to original Registrar");
  confirmContinue();
  const originalWildRegistrar = await hre.upgrades.upgradeProxy(
    legacyRegistrarAddress,
    new Registrar__factory(signer)
  );
  await originalWildRegistrar.deployTransaction.wait(waitBlocks);

  logger.log("7b. Upgrade beacon registrars to original Registrar");
  confirmContinue();
  const originalSubdomainRegistrar = await hre.upgrades.upgradeBeacon(
    beaconAddress,
    new Registrar__factory(signer)
  );
  await originalSubdomainRegistrar.deployTransaction.wait(waitBlocks);

  logger.log("Migration complete")
  return;
}
