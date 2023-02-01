import * as hre from "hardhat";

import { Registrar__factory } from "../../typechain";
import { getLogger } from "../../utilities";
import { zer0ProtocolAddresses } from "@zero-tech/zero-contracts";
import { confirmContinue, createAndProposeTransaction } from "../shared/helpers";
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

    logger.log(`Using Signer address ${deployer.address}`);
    logger.log(`Please make sure signer is one of the Gnosis Safe owner`);

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
      const registrar = Registrar__factory.connect(registrarAddress, deployer);
      const owner = await registrar.owner();

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
          Label: "Gnosis Safe(owner)",
          Info: owner,
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

      /**
       * await registrar.adminBurnToken(domainConfig.id)
       * 
       * Registrar will burn token by owner
       */
      await createAndProposeTransaction(
        hre.network.name,
        owner,
        deployer,
        registrar,
        "adminBurnToken(uint256)",
        [domainConfig.id],
      );

      logger.log(`Successfully proposed to burn domain: ${domainConfig.label}`);
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
