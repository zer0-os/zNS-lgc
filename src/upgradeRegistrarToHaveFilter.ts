import * as hre from "hardhat";

import {
  Registrar__factory,
} from "../typechain";
import { getLogger } from "../utilities";
import { zer0ProtocolAddresses } from "@zero-tech/zero-contracts";

const logger = getLogger("src::test-filter");

const main = async () => {
  const [deployer] = await hre.ethers.getSigners();

  logger.log(`Using deployer address ${deployer.address}`);

  let registrarAddress: string;
  let beaconAddress: string;
  if (hre.network.name === "hardhat") {
    registrarAddress = "0x009A11617dF427319210e842D6B202f3831e0116";
    beaconAddress = "0x9e20B753d87c4B6632394566EcbE7453B5404871";
  } else {
    const addresses = zer0ProtocolAddresses[hre.network.name];
    if (!addresses) {
      throw Error(`Network ${hre.network.name} not supported.`)
    }
    registrarAddress = addresses.zNS.registrar!;
    beaconAddress = addresses.zNS.subregistrarBeacon!;
  }

  logger.log(`Upgrading Registrar at ${registrarAddress} to include OpenSea filter functionality`);

  const registrarFactory = new Registrar__factory(deployer)

  if (hre.network.name === "hardhat") {
    await hre.upgrades.forceImport(registrarAddress, registrarFactory);
    await hre.upgrades.forceImport(beaconAddress, registrarFactory);
  }

  // Factory for registrar that includes of the OS changes
  const upgradeRegistrarTx = await hre.upgrades.upgradeProxy(
    registrarAddress,
    registrarFactory
  );

  await upgradeRegistrarTx.deployed();

  logger.log(`Upgrading Registrar Beacon at ${beaconAddress} to include OpenSea filter functionality`);

  // Upgrade Beacon
  const upgradeRegistrarBeaconTx = await hre.upgrades.upgradeBeacon(beaconAddress, registrarFactory);
  await upgradeRegistrarBeaconTx.deployed();

  const implementationAddress = await hre.upgrades.erc1967.getImplementationAddress(registrarAddress);
  const beaconImplementationAddress = await hre.upgrades.beacon.getImplementationAddress(registrarAddress);

  try {
    logger.log(`Attempting to verify implementation contract ${implementationAddress} with etherscan`);
    await hre.run("verify:verify", {
      address: implementationAddress,
      constructorArguments: [],
    });
    logger.log(`Attempting to verify implementation contract ${beaconImplementationAddress} with etherscan`);

    await hre.run("verify:verify", {
      address: beaconImplementationAddress,
      constructorArguments: [],
    })
  } catch (e) {
    logger.error(`Failed to verify contract: ${e}`);
  }

  logger.log(`Successfully upgraded registrar at ${registrarAddress}`);
}

main();
