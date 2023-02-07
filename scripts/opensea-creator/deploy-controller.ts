import * as hre from "hardhat";

import { MockController__factory, ZNSHub__factory } from "../../typechain";
import { getLogger } from "../../utilities";
import { ethers } from "hardhat";

const logger = getLogger("scripts::new-impl");

const main = async () => {
  const [deployer] = await hre.ethers.getSigners();

  logger.log(`Using deployer address ${deployer.address}`);

  const network = hre.network.name;
  if (network === "goerli") {
    const zNSHubAddress = process.env.ZNSHub_ADDRESS!;
    const zNSHub = ZNSHub__factory.connect(zNSHubAddress, deployer);
    const defaultRegistrar = await zNSHub.defaultRegistrar();

    const ControllerFactory = new MockController__factory(deployer);
    const controller = await ControllerFactory.deploy(defaultRegistrar);
    logger.log(`Controller deployed at ${controller.address}`);

    logger.log("Congratulations! You can check!");
  }
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
