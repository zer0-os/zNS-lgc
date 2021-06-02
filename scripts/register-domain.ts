// Utility to register a ZNS domain using a basic controller

import { ethers, network } from "hardhat";
import {
  BasicController,
  BasicController__factory,
  Registrar__factory,
} from "../typechain";
import * as fs from "fs";
import { DeploymentOutput, deploymentsFolder, getLogger } from "../utilities";
import { getEvent } from "../test/helpers";

const logger = getLogger("scripts::register-domain");

const parentId = ethers.constants.HashZero;
const domainName = "wilder";
const domainMetadata =
  "https://ipfs.io/ipfs/QmTH2eNVXmeyxPBG1kQaeTcueBiv34FpGzE29indvtqYgp";
const domainOwner = "0x35888AD3f1C0b39244Bb54746B96Ee84A5d97a53";

async function main() {
  const accounts = await ethers.getSigners();
  const deploymentAccount = accounts[0];

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

  if (!deploymentData.basicController) {
    logger.error(`is not deployed.`);
    process.exit(1);
  }

  const controllerFactory = new BasicController__factory(deploymentAccount);
  const controller: BasicController = await controllerFactory.attach(
    deploymentData.basicController.address
  );

  logger.debug(`Targeting controller at ${controller.address}`);
  logger.debug(`Using account ${deploymentAccount.address}`);

  logger.debug(`Registering subdomain '${domainName}' on parent '${parentId}'`);
  const tx = await controller.registerSubdomainExtended(
    parentId,
    domainName,
    domainOwner,
    domainMetadata,
    0,
    true
  );

  logger.debug(`waiting to mine...`);
  const event = await getEvent(
    tx,
    "DomainCreated",
    Registrar__factory.connect(deploymentAccount.address, deploymentAccount)
  );
  logger.log(`Created domain id: ${event.args["id"]}`);
}

main();
