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

const logger = getLogger("src::register-domain");

const parentId = ethers.constants.HashZero;
const domainName = "wilder";
const domainMetadata =
  "https://ipfs.io/ipfs/QmTH2eNVXmeyxPBG1kQaeTcueBiv34FpGzE29indvtqYgp";
const domainOwner = "0x37358Aa5D051B434C23Bad744E56E6A484107272";

async function main() {
  const accounts = await ethers.getSigners();
  const deploymentAccount = accounts[0];
  console.log(`account ${deploymentAccount} is being used`);

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
    false
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
