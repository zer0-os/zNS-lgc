import * as hre from "hardhat";
import { ethers } from "hardhat";

import {
  Registrar,
  Registrar__factory,
  ZNSHub__factory,
} from "../../typechain";
import { getLogger } from "../../utilities";
import { zer0ProtocolAddresses } from "@zero-tech/zero-contracts";
import { confirmContinue } from "../shared/helpers";
import { domainConfigs } from "./config";

const logger = getLogger("scripts::create-degen-root-domains");

/**
 * Please make sure that create Degen root domains after root migration
 */
const main = async () => {
  const [deployer] = await hre.ethers.getSigners();

  logger.log(`Using deployer address ${deployer.address}`);

  if (hre.network.name === "goerli" || hre.network.name === "mainnet") {
    const addresses = zer0ProtocolAddresses[hre.network.name];
    if (!addresses) {
      throw Error(`Network ${hre.network.name} not supported.`);
    }

    const zNSAddress = addresses.zNS.znsHub!;
    const zNSHub = ZNSHub__factory.connect(zNSAddress, deployer);

    const registrarAddress = addresses.zNS.registrar;
    const beaconAddress = addresses.zNS.subregistrarBeacon!;

    const config = domainConfigs[hre.network.name];

    for (const label of Object.keys(config)) {
      const domainConfig = config[label];

      const exists = await zNSHub.domainExists(domainConfig.id);
      if (exists) {
        logger.error(`${label} domain already exists`);
        continue;
      }

      logger.log(`Creating ${label} root domain...`);
      console.table([
        {
          Label: "Parent registrar",
          Info: domainConfig.parentRegistrar,
        },
        {
          Label: "Domain Id",
          Info: domainConfig.id,
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

      const parentRegistrar = domainConfig.parentRegistrar
        ? domainConfig.parentRegistrar
        : registrarAddress;

      logger.log("Deploying Registrar for new domain as Beacon!");
      const registrar = (await hre.upgrades.deployBeaconProxy(
        beaconAddress,
        new Registrar__factory(deployer),
        [
          parentRegistrar, // Parent registrar
          domainConfig.id, // Root domain id
          "Zero Name Service",
          "zNS",
          zNSHub.address,
        ]
      )) as Registrar;
      await registrar.deployTransaction.wait(3);
      logger.log(`Registrar deployed at ${registrar.address}`);

      logger.log(`Successfully registered new domain: ${domainConfig.label}`);
    }

    logger.log("Congratulations! You created domains successfully!");
  }
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
