import { ethers, upgrades, network } from "hardhat";
import { Registrar__factory } from "../typechain";
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

const logger = getLogger("deploy-registrar");

async function main() {
  const accounts = await ethers.getSigners();
  const deploymentAccount = accounts[0];

  logger.log(`Deploying to ${network.name}`);

  logger.log(
    `'${deploymentAccount.address}' will be used as the deployment account`
  );

  const registrarFactory = new Registrar__factory(deploymentAccount);
  const bytecodeHash = hashBytecodeWithoutMetadata(registrarFactory.bytecode);

  logger.log(`Implementation version is ${bytecodeHash}`);

  const instance = await upgrades.deployProxy(registrarFactory, [], {
    initializer: "initialize",
  });
  await instance.deployed();

  logger.log(`Deployed Registrar to '${instance.address}'`);

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

  const registrarObject: DeployedContract = {
    name: "Registrar",
    address: instance.address,
    version: bytecodeHash,
  };

  const ozUpgradesManifestClient = await Manifest.forNetwork(network.provider);
  const manifest = await ozUpgradesManifestClient.read();
  const implementationContract = manifest.impls[bytecodeHash];

  if (implementationContract) {
    registrarObject.implementation = implementationContract.address;
  }

  deploymentData.registrar = registrarObject;

  const jsonToWrite = JSON.stringify(deploymentData, undefined, 2);

  logger.log(`Updated ${filepath}`);

  fs.mkdirSync(deploymentsFolder, { recursive: true });
  fs.writeFileSync(filepath, jsonToWrite);
}

main();
