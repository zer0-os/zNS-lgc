import * as hre from "hardhat";

import {
  Registrar__factory,
} from "../typechain";
import { getLogger } from "../utilities";
import { zer0ProtocolAddresses } from "@zero-tech/zero-contracts";
import {
  hashBytecodeWithoutMetadata,
  Manifest,
} from "@openzeppelin/upgrades-core";

const logger = getLogger("scripts::test-filter");

const main = async () => {
  const [deployer] = await hre.ethers.getSigners();

  logger.log(`Using deployer address ${deployer.address}`);

  let registrarAddress: string;
  if (hre.network.name === "hardhat") {
    registrarAddress = "0x009A11617dF427319210e842D6B202f3831e0116";
    // registrarAddress = "0xc2e9678A71e50E5AEd036e00e9c5caeb1aC5987D"
  } else {
    const addresses = zer0ProtocolAddresses[hre.network.name];
    if (!addresses) {
      throw Error(`Network ${hre.network.name} not supported.`)
    }
    registrarAddress = addresses.zNS.registrar!;
  }

  logger.log(`Upgrading Registrar at ${registrarAddress} to include OpenSea filter functionality`);

  const registrarFactory = new Registrar__factory(deployer)

  if (hre.network.name === "hardhat") {
    await hre.upgrades.forceImport(registrarAddress, registrarFactory);
  }

  // Factory for registrar that includes of the OS changes
  const upgradeRegistrarTx = await hre.upgrades.upgradeProxy(
    registrarAddress,
    registrarFactory
  );

  const upgradedRegistrar = await upgradeRegistrarTx.deployed();
  const implementationAddress = await hre.upgrades.erc1967.getImplementationAddress(upgradedRegistrar.address);

  logger.log(`Attempting to verify implementation contract at ${implementationAddress} with etherscan`);
  try {
    await hre.run("verify:verify", {
      address: implementationAddress,
      constructorArguments: [],
    });
  } catch (e) {
    logger.error(`Failed to verify contract: ${e}`);
  }

  logger.log(`Successfully upgraded registrar at ${upgradedRegistrar.address}`);
}

main();
