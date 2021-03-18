import { ethers, network, run } from "hardhat";
import {
  BasicController,
  BasicController__factory,
  Registrar,
  Registrar__factory,
} from "../typechain";
import * as fs from "fs";
import { DeploymentOutput, deploymentsFolder, getLogger } from "../utilities";

const logger = getLogger("scripts::deploy-registrar");

async function main() {
  await run("compile");

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

  if (!deploymentData.registrar || !deploymentData.basicController) {
    logger.error(`Registrar and Controller are not deployed.`);
    process.exit(1);
  }

  const registrarFactory = new Registrar__factory(deploymentAccount);
  const registrar: Registrar = await registrarFactory.attach(
    deploymentData.registrar.address
  );

  logger.log(`Targeting Registrar at ${registrar.address}`);

  const registrarOwner = await registrar.owner();
  if (
    registrarOwner.toLocaleLowerCase() !=
    deploymentAccount.address.toLocaleLowerCase()
  ) {
    logger.error(`No access on registrar to add controller!`);
    process.exit(1);
  }

  const controllerFactory = new BasicController__factory(deploymentAccount);
  const controller: BasicController = await controllerFactory.attach(
    deploymentData.basicController.address
  );

  const alreadyController = await registrar["controllers(address)"](
    controller.address
  );

  if (alreadyController) {
    logger.error(`${controller.address} is already a controller`);
    return;
  }

  logger.log(`Adding ${controller.address} as a controller.`);
  await registrar.addController(controller.address);
}

main();
