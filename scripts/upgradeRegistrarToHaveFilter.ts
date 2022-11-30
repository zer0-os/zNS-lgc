import * as hre from "hardhat";
import { ethers } from "hardhat";

import {
  Registrar__factory,
  OriginalRegistrar__factory,
} from "../typechain";
import { getLogger } from "../utilities";
import { zer0ProtocolAddresses } from "@zero-tech/zero-contracts"

const logger = getLogger("scripts::test-filter");

// Goerli Addresses
const hubAddress = "0xce1fE2DA169C313Eb00a2bad25103D2B9617b5e1";

const main = async () => {
  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name

  logger.log(`Using deployer address ${deployer.address}`);

  let registrarAddress;

  if (network === "hardhat") {
    const ogRegistrarFactory = new OriginalRegistrar__factory(deployer);

    const ogRegistrarDeploy = await hre.upgrades.deployProxy(
      ogRegistrarFactory,
      [
        ethers.constants.AddressZero,
        ethers.constants.HashZero,
        "Zer0 Name Service",
        "ZNS",
        hubAddress
      ],
      {
        initializer: "initialize"
      }
    )
    const ogRegistrar = await ogRegistrarDeploy.deployed();
    registrarAddress = ogRegistrar.address;
  } else {
    const addresses = zer0ProtocolAddresses[hre.network.name];
    if (!addresses) {
      throw Error(`Network ${hre.network.name} not supported.`)
    }
    registrarAddress = addresses.zNS.registrar;
  }

  logger.log("Comparing bytecode length")
  const regFactory = new Registrar__factory(deployer);
  logger.log("Bytecode for new Registrar " + regFactory.bytecode.length / 2);
  logger.log("Bytecode for original Registrar " + new OriginalRegistrar__factory(deployer).bytecode.length / 2);

  await regFactory.deploy();

  logger.log(`Upgrading Registrar at ${registrarAddress} to include OpenSea filter functionality`);

  // Factory for registrar that includes of the OS changes
  const upgradeRegistrarTx = await hre.upgrades.upgradeProxy(
    registrarAddress!,
    regFactory
  );

  const upgradedRegistrar = await upgradeRegistrarTx.deployed();

  logger.log(`Successfully upgraded registrar at ${upgradedRegistrar.address}`);
}

main();
