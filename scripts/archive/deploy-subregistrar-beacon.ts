import * as hre from "hardhat";
import { Registrar__factory } from "../../typechain";
import { getLogger } from "../../utilities";

async function main() {
  const logger = getLogger("scripts::deploy-subregistrar-beacon");

  const accounts = await hre.ethers.getSigners();
  const deploymentAccount = accounts[0];

  logger.log(`Deploying to ${hre.network.name}`);

  logger.log(
    `'${deploymentAccount.address}' will be used as the deployment account`
  );
  const beacon = await hre.upgrades.deployBeacon(new Registrar__factory(deploymentAccount), {});
  const instance = await beacon.deployed();

  logger.log(`Deployed subregistrar beacon to '${instance.address}'`);

  logger.log(`Attempting to verify implementation contract for ${instance.address}`);

  const implAddress = await hre.upgrades.beacon.getImplementationAddress(instance.address);
  try {
    await hre.run("verify:verify", {
      address: implAddress,
      constructorArguments: [],
    });
  } catch (e) {
    logger.error(`Failed to verify contract: ${e}`);
  }
}

main().catch(console.error);
