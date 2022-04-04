import { ethers, network, run } from "hardhat";
import { Registrar, Registrar__factory } from "../typechain";
import * as fs from "fs";
import { DeploymentOutput, deploymentsFolder, getLogger } from "../utilities";

const logger = getLogger("scripts::add-basic-controller");

const deployerNew = "0x7829Afa127494Ca8b4ceEF4fb81B78fEE9d0e471";
const registrarAddress = "0xc2e9678A71e50E5AEd036e00e9c5caeb1aC5987D";

async function main() {
  await run("compile");

  const accounts = await ethers.getSigners();
  const deploymentAccount = accounts[0];

  if ((await ethers.provider.getNetwork()).chainId == 31337) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [deploymentAccount.address],
    });
  }

  const instance: Registrar = Registrar__factory.connect(
    registrarAddress,
    deploymentAccount
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

  logger.log(`Targeting Registrar at ${instance.address}`);

  const registrarOwner = await instance.owner();
  if (
    registrarOwner.toLocaleLowerCase() !=
    deploymentAccount.address.toLocaleLowerCase()
  ) {
    logger.error(`No access on registrar to add controller!`);
    process.exit(1);
  }

  const alreadyController = await instance.controllers(deployerNew);

  if (alreadyController) {
    logger.error(`${deployerNew} is already a controller`);
    return;
  }

  logger.log(`Adding ${deployerNew} as a controller.`);
  await instance.addController(deployerNew);
}

main();
