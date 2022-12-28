import * as hre from "hardhat";
import { ethers } from "hardhat";

import { Registrar__factory } from "../typechain";
import { getLogger } from "../utilities";
import fs from 'fs';

const logger = getLogger("scripts::deploy-registar-impl");

const main = async () => {
  const [deployer] = await hre.ethers.getSigners();

  logger.log(`Using deployer address ${deployer.address}`);

  if (hre.network.name === "goerli" || hre.network.name === "mainnet") {
    logger.log("Deploying CreateProxyLib library...");
    const CreateProxyLibFactory = await ethers.getContractFactory("CreateProxyLib");
    const createProxyLib = await CreateProxyLibFactory.deploy();
    await createProxyLib.deployTransaction.wait(2);

    logger.log(
      `New CreateProxyLib deployed at ${createProxyLib.address}`
    );

    logger.log("Deploying OperatorFiltererLib library...");
    const OperatorFiltererLibFactory = await ethers.getContractFactory("OperatorFiltererLib");
    const operatorFiltererLib = await OperatorFiltererLibFactory.deploy();
    await operatorFiltererLib.deployTransaction.wait(2);

    logger.log(
      `New OperatorFiltererLib deployed at ${operatorFiltererLib.address}`
    );

    logger.log("Deploying new implementation ...");
    const RegistrarFactory = new Registrar__factory(
      {
        "contracts/libraries/OperatorFiltererLib.sol:OperatorFiltererLib": operatorFiltererLib.address,
        "contracts/libraries/CreateProxyLib.sol:CreateProxyLib": createProxyLib.address
      },
      deployer
    );
    const newRegistrar = await RegistrarFactory.deploy();
    await newRegistrar.deployTransaction.wait(2);

    logger.log(
      `New Registrar(implementation) deployed at ${newRegistrar.address}`
    );

    logger.log("Output addresses of libraries in `temp/libraries.ts`...");
    const libraryData = `export default {
      CreateProxyLib: "${createProxyLib.address}",
      OperatorFiltererLib: "${operatorFiltererLib.address}"
    };`
    fs.writeFileSync('./temp/libraries.ts', libraryData);

    logger.log("Congratulations! You deployed new Registrar contract!");
  }
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

