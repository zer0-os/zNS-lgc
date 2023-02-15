import * as hre from "hardhat";

import { getLogger } from "../utilities";
import { deployZNS } from "./shared/deploy";

const logger = getLogger("scripts::deploy-zns");

const main = async () => {
  const [deployer] = await hre.ethers.getSigners();

  logger.log(`Using deployer address ${deployer.address}`);

  const network = hre.network.name;
  if (network === "goerli" || network === "mainnet" || network === "hardhat") {
    const { zNSHub, registrar, proxyAdmin, upgradeableBeacon } =
      await deployZNS(network, deployer, logger);

    console.table([
      {
        Label: "zNSHub",
        Info: zNSHub.address,
      },
      {
        Label: "Registrar",
        Info: registrar.address,
      },
      {
        Label: "ProxyAdmin",
        Info: proxyAdmin.address,
      },
      {
        Label: "UpgradeableBeacon",
        Info: upgradeableBeacon.address,
      },
    ]);

    logger.log("Congratulations! You can check!");
  }
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
