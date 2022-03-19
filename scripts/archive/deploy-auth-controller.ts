import { ethers, upgrades, network, run } from "hardhat";
import {
  AuthBasicController__factory,
  Registrar,
  Registrar__factory,
} from "../typechain";
import * as fs from "fs";
import {
  DeployedContract,
  DeploymentOutput,
  deploymentsFolder,
  getLogger,
} from "../utilities";

import {
  hashBytecodeWithoutMetadata,
  Manifest,
} from "@openzeppelin/upgrades-core";

const logger = getLogger("scripts::deploy-auth-controller");

async function main() {
  await run("compile");

  const accounts = await ethers.getSigners();
  const deploymentAccount = accounts[0];

  logger.log(`Deploying to ${network.name}`);

  logger.log(
    `'${deploymentAccount.address}' will be used as the deployment account`
  );

  const fileName = `${network.name}.json`;
  const filepath = `${deploymentsFolder}/${fileName}`;
  let deploymentData: DeploymentOutput;
  try {
    deploymentData = JSON.parse(
      fs.readFileSync(filepath).toString()
    ) as DeploymentOutput;
  } catch (e) {
    logger.debug(`New deployment for network detected.`);
    deploymentData = {};
  }

  if (!deploymentData.registrar) {
    logger.error(
      `Registrar must be deployed before controller can be deployed!`
    );
    process.exit(1);
  }

  const registrarFactory = new Registrar__factory(deploymentAccount);
  const registrar: Registrar = await registrarFactory.attach(
    deploymentData.registrar.address
  );

  const controllerFactory = new AuthBasicController__factory(deploymentAccount);
  const bytecodeHash = hashBytecodeWithoutMetadata(controllerFactory.bytecode);

  logger.log(`Implementation version is ${bytecodeHash}`);

  const instance = await upgrades.deployProxy(
    controllerFactory,
    [registrar.address],
    {
      initializer: "initialize",
    }
  );
  await instance.deployed();

  logger.log(`Deployed AuthBasicController to '${instance.address}'`);

  const deploymentRecord: DeployedContract = {
    name: "AuthBasicController",
    address: instance.address,
    version: bytecodeHash,
    date: new Date().toISOString(),
  };

  const ozUpgradesManifestClient = await Manifest.forNetwork(network.provider);
  const manifest = await ozUpgradesManifestClient.read();
  const implementationContract = manifest.impls[bytecodeHash];

  if (implementationContract) {
    deploymentRecord.implementation = implementationContract.address;
  }

  deploymentData.authController = deploymentRecord;

  const jsonToWrite = JSON.stringify(deploymentData, undefined, 2);

  logger.log(`Updated ${filepath}`);

  fs.mkdirSync(deploymentsFolder, { recursive: true });
  fs.writeFileSync(filepath, jsonToWrite);

  if (implementationContract) {
    logger.log(`Waiting for 5 confirmations`);
    await instance.deployTransaction.wait(5);

    logger.log(`Attempting to verify implementation contract with etherscan`);
    try {
      await run("verify:verify", {
        address: implementationContract.address,
        constructorArguments: [],
      });
    } catch (e) {
      logger.error(`Failed to verify contract: ${e}`);
    }
  }
}

main();
