import { ethers, network, run } from "hardhat";
import { Registrar, Registrar__factory } from "../../typechain";
import * as fs from "fs";
import { DeploymentOutput, deploymentsFolder, getLogger } from "../../utilities";

const logger = getLogger("src::add-basic-controller");

// Astro
const deployerNew = "0x35888AD3f1C0b39244Bb54746B96Ee84A5d97a53";
const registrarAddress = "0x009A11617dF427319210e842D6B202f3831e0116";

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
