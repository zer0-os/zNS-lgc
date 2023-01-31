import * as hre from "hardhat";
import { ethers } from "hardhat";
import {
  DefenderRelaySigner,
  DefenderRelayProvider,
} from "defender-relay-client/lib/ethers";

import { Registrar__factory, ZNSHub__factory } from "../../typechain";
import { getLogger } from "../../utilities";
import { zer0ProtocolAddresses } from "@zero-tech/zero-contracts";
import { confirmContinue } from "../shared/helpers";
import { domainConfigs } from "./config";

const logger = getLogger("scripts::burn-degen-root-domains");

const main = async () => {
  const [deployer] = await hre.ethers.getSigners();

  if (hre.network.name === "goerli" || hre.network.name === "mainnet") {
    const addresses = zer0ProtocolAddresses[hre.network.name];
    if (!addresses) {
      throw Error(`Network ${hre.network.name} not supported.`);
    }

    const config = domainConfigs[hre.network.name];

    // Create Defender Relayer Clients
    const credentials = {
      apiKey: process.env.RELAY_API_KEY!,
      apiSecret: process.env.RELAY_SECRET_KEY!,
    };
    const provider = new DefenderRelayProvider(credentials);
    const signer = new DefenderRelaySigner(credentials, provider, {
      speed: "fast",
    });
    const signerAddress = await signer.getAddress();

    logger.log(`Using Defender Relay Signer address ${signerAddress}`);

    for (const label of Object.keys(config)) {
      const domainConfig = config[label];

      const registrarAddress = domainConfig.parentRegistrar;
      if (!registrarAddress) {
        logger.error(
          `Parent registrar is undefined, skip burning for ${label}`
        );
        continue;
      }
      logger.log(
        `Checking if signer is the owner of Registrar ${registrarAddress} ...`
      );
      const registrar = Registrar__factory.connect(registrarAddress, signer);
      const owner = await registrar.owner();
      if (
        owner.toLowerCase().localeCompare(signerAddress.toLowerCase()) !== 0
      ) {
        logger.error(`Signer is not owner address for ${label}`);
        continue;
      }

      const exists = await registrar.domainExists(domainConfig.id);
      if (!exists) {
        logger.error(`${label} domain does not exist`);
        continue;
      }

      logger.log(`Burning ${label} root domain...`);
      console.table([
        {
          Label: "Registrar",
          Info: registrarAddress,
        },
        {
          Label: "Domain Id",
          Info: domainConfig.id,
        },
        {
          Label: "Label",
          Info: domainConfig.label,
        },
      ]);

      confirmContinue();

      const tx = await registrar.adminBurnToken(domainConfig.id);
      await tx.wait();

      logger.log(`Successfully burned domain: ${domainConfig.label}`);
    }

    logger.log("Congratulations! Burned domains successfully!");
  }
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
