import * as hre from "hardhat";
import { ethers } from "hardhat";

import {
  Registrar__factory,
  OriginalRegistrar__factory,
} from "../typechain";
import { getLogger } from "../utilities";

const logger = getLogger("scripts::test-filter");

const main = async () => {
  const [deployer] = await hre.ethers.getSigners();

  logger.log(`Using deployer address ${deployer.address}`);

  // Goerli Address
  const hubAddress = "0xce1fE2DA169C313Eb00a2bad25103D2B9617b5e1";

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

  logger.log("Comparing bytecode length")
  const regFactory = new Registrar__factory(deployer);
  logger.log("Bytecode in script: " + regFactory.bytecode.length / 2);

  const reg = await regFactory.deploy(); // passes

  logger.log(`Upgrading Registrar at ${ogRegistrar.address} to include OpenSea filter functionality`);

  // Factory for registrar that includes of the OS changes
  const upgradeRegistrarTx = await hre.upgrades.upgradeProxy(
    ogRegistrar.address,
    new Registrar__factory(deployer)
  );

  const upgradedRegistrar = await upgradeRegistrarTx.deployed();

  logger.log(`Successfully upgraded registrar at ${upgradedRegistrar.address}`);
}

main();
