import * as hre from "hardhat";
import { ethers } from "hardhat";

import {
  Registrar__factory,
  ZNSHub__factory,
} from "../../typechain";
import { getLogger } from "../../utilities";
import { confirmContinue, calculateGasMargin } from "../shared/helpers";
import { DomainKind, mintSenario, TestAccounts } from "./config";

const logger = getLogger("scripts::opensea-creator");

/**
 * Please make sure that create Degen root domains after root migration
 */
const main = async () => {
  const deployers = await hre.ethers.getSigners();

  for (const deployer of deployers) {
    logger.log(`Using deployer addresses ${deployer.address}`);
  }

  if (hre.network.name === "goerli" && deployers.length >= 5) {
    const signers = {
      [TestAccounts.AccountA]: deployers[1],
      [TestAccounts.AccountB]: deployers[2],
      [TestAccounts.AccountC]: deployers[3],
      [TestAccounts.AccountD]: deployers[4],
    }

    const zNSHubAddress = process.env.ZNSHub_ADDRESS!;
    if (!zNSHubAddress) {
      logger.error('Not found zNSHub address');
      return;
    }

    const zNSHub = ZNSHub__factory.connect(zNSHubAddress, deployers[0]);

    for (const mintConfig of mintSenario) {
      const exists = await zNSHub.domainExists(mintConfig.id);
      if (exists) {
        logger.error(`${mintConfig.name} domain already exists`);
        continue;
      }

      logger.log(`Creating ${mintConfig.name} domain...`);
      console.table([
        {
          Label: "tx.origin",
          Info: signers[mintConfig["tx.origin"]].address,
        },
        {
          Label: "Domain name",
          Info: mintConfig.name,
        },
        {
          Label: "Domain Id",
          Info: mintConfig.id,
        },
        {
          Label: "Parent Id",
          Info: mintConfig.parentId,
        },
        {
          Label: "MetadataUri",
          Info: mintConfig.metadataUri,
        },
        {
          Label: "Domain Kind",
          Info: mintConfig.domainKind == DomainKind.BeaconDomain ? "BeaconDomain" : "PureDomain",
        },
        {
          Label: "Royalty amount",
          Info: 0,
        },
        {
          Label: "Lock",
          Info: false,
        },
        {
          Label: "Send to user",
          Info: signers[mintConfig.sendToUser].address
        },
      ]);

      let registrarAddress = await zNSHub.subdomainRegistrars(mintConfig.parentId);
      if (registrarAddress == ethers.constants.AddressZero) {
        registrarAddress = await zNSHub.getRegistrarForDomain(mintConfig.parentId);
      }
      logger.info(`Registrar for domain ${mintConfig.name}: ${registrarAddress}`);

      const registrar = Registrar__factory.connect(registrarAddress, signers[mintConfig["tx.origin"]]);
      if (mintConfig.domainKind === DomainKind.BeaconDomain) {
        logger.info(`Deploying Beacon domain...`);
        confirmContinue();

        const estimatedGas = await registrar.estimateGas.registerSubdomainContract(
          mintConfig.parentId,
          mintConfig.label,
          signers[mintConfig["tx.origin"]].address,
          mintConfig.metadataUri,
          0, 
          false,
          signers[mintConfig.sendToUser].address,
        );
        logger.info(`Estimated gas: ${estimatedGas.toString()}`);
        const tx = await registrar.registerSubdomainContract(
          mintConfig.parentId,
          mintConfig.label,
          signers[mintConfig["tx.origin"]].address,
          mintConfig.metadataUri,
          0, 
          false,
          signers[mintConfig.sendToUser].address,
          {
            gasLimit: calculateGasMargin(estimatedGas)
          }
        );
        logger.info(`Waiting tx: ${tx.hash}`);
        await tx.wait(3);
      } else if (mintConfig.domainKind === DomainKind.PureDomain) {
        logger.info(`Deploying Pure domain...`);
        confirmContinue();

        const estimatedGas = await registrar.estimateGas.registerDomainAndSend(
          mintConfig.parentId,
          mintConfig.label,
          signers[mintConfig["tx.origin"]].address,
          mintConfig.metadataUri,
          0, 
          false,
          signers[mintConfig.sendToUser].address,
        );
        logger.info(`Estimated gas: ${estimatedGas.toString()}`);
        const tx = await registrar.registerDomainAndSend(
          mintConfig.parentId,
          mintConfig.label,
          signers[mintConfig["tx.origin"]].address,
          mintConfig.metadataUri,
          0, 
          false,
          signers[mintConfig.sendToUser].address,
          {
            gasLimit: calculateGasMargin(estimatedGas)
          }
        );
        logger.info(`Waiting tx: ${tx.hash}`);
        await tx.wait(3);
      }

      logger.log(`Successfully registered new domain: ${mintConfig.name}`);
    }

    logger.log("Congratulations! You created domains successfully!");
  } else {
    throw Error("Bad network");
  }
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
