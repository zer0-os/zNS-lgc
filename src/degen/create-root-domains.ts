import * as hre from "hardhat";
import { ethers } from "hardhat";

import { Registrar__factory } from "../../typechain";
import { getLogger } from "../utilities";
import { zer0ProtocolAddresses } from "@zero-tech/zero-contracts";
import { confirmContinue } from "../shared/helpers";
import { domainConfigs } from "./config";

const logger = getLogger("src::create-degen-root-domain");

const main = async () => {
  const [deployer] = await hre.ethers.getSigners();

  logger.log(`Using deployer address ${deployer.address}`);

  if (hre.network.name === "goerli" || hre.network.name === "mainnet") {
    const addresses = zer0ProtocolAddresses[hre.network.name];
    if (!addresses) {
      throw Error(`Network ${hre.network.name} not supported.`);
    }

    const registrarAddress = addresses.zNS.registrar!;
    const registrar = Registrar__factory.connect(registrarAddress, deployer);

    const config = domainConfigs[hre.network.name];
    const parentId = ethers.constants.HashZero;

    for (const label of Object.keys(config)) {
      const domainConfig = config[label];

      logger.log(`Creating ${label} root domain...`);
      console.table([
        {
          Label: "Parent Id",
          Info: parentId,
        },
        {
          Label: "Label",
          Info: domainConfig.label,
        },
        {
          Label: "Minter",
          Info: domainConfig.minter,
        },
        {
          Label: "MetadataUri",
          Info: domainConfig.metadataUri,
        },
        {
          Label: "Royalty amount",
          Info: 0,
        },
        {
          Label: "Lock",
          Info: false,
        },
      ]);

      confirmContinue();

      const tx = await registrar.registerSubdomainContract(
        parentId,
        domainConfig.label,
        domainConfig.minter,
        domainConfig.metadataUri,
        0,
        false,
        domainConfig.minter
      );
      await tx.wait(3);
    }

    logger.log("Congratulations! You registered domains successfully!");
  }
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
