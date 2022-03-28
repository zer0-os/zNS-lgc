import { ethers, upgrades, network, run } from "hardhat";

import {
  hashBytecodeWithoutMetadata,
  Manifest,
} from "@openzeppelin/upgrades-core";
import { getLogger } from "../../utilities";
import { MockToken__factory } from "../../typechain";

const logger = getLogger("scripts::deploy-mock-token");

async function main() {
  await run("compile");

  const accounts = await ethers.getSigners();
  const deploymentAccount = accounts[0];

  logger.log(`Deploying to ${network.name}`);

  logger.log(
    `'${deploymentAccount.address}' will be used as the deployment account`
  );

  const factory = new MockToken__factory(deploymentAccount);
  const bytecodeHash = hashBytecodeWithoutMetadata(factory.bytecode);

  logger.log(`Implementation version is ${bytecodeHash}`);

  const instance = await upgrades.deployProxy(
    factory,
    ["Mock zDAO Voting Token", "mzVOTE"],
    {
      initializer: "initialize",
    }
  );
  await instance.deployed();

  logger.log(`Deployed to '${instance.address}'`);

  const ozUpgradesManifestClient = await Manifest.forNetwork(network.provider);
  const manifest = await ozUpgradesManifestClient.read();
  const implementationContract = manifest.impls[bytecodeHash];

  if (implementationContract) {
    logger.log(`Waiting for 5 confirmations`);
    if (network.name !== "hardhat" && network.name !== "homestead") {
      await instance.deployTransaction.wait(5); // infinite loops on homestead / hardhat network
    }

    logger.log(`Attempting to verify implementation contract with etherscan`);
    try {
      await run("verify:verify", {
        address: implementationContract.address,
        constructorArguments: [],
      });
    } catch (e) {
      logger.error(`Failed to verify contract: ${e}`);
    }
  }
}

main();
