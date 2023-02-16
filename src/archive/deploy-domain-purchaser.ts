import { ethers, upgrades, network, run } from "hardhat";

import {
  hashBytecodeWithoutMetadata,
  Manifest,
} from "@openzeppelin/upgrades-core";
import { getLogger } from "../utilities";
import { DomainPurchaser__factory } from "../../typechain";

const logger = getLogger("src::deploy-domain-purchaser");

async function main() {
  await run("compile");

  const tenToEighteen = ethers.BigNumber.from(10).pow(18)

  // Goerli contract addresses
  const paymentToken = "0x0e46c45f8aca3f89Ad06F4a20E2BED1A12e4658C";
  const znsHub = "0xce1fE2DA169C313Eb00a2bad25103D2B9617b5e1";
  const platformWallet = "0x35888AD3f1C0b39244Bb54746B96Ee84A5d97a53";
  const rootPrices = [
    ethers.BigNumber.from(1).mul(tenToEighteen),
    ethers.BigNumber.from(2).mul(tenToEighteen),
    ethers.BigNumber.from(3).mul(tenToEighteen)
  ];
  const platformFee = "50";

  const accounts = await ethers.getSigners();
  const deploymentAccount = accounts[0];

  logger.log(`Deploying to ${network.name}`);

  logger.log(
    `'${deploymentAccount.address}' will be used as the deployment account`
  );

  const factory = new DomainPurchaser__factory(deploymentAccount);
  const bytecodeHash = hashBytecodeWithoutMetadata(factory.bytecode);

  logger.log(`Implementation version is ${bytecodeHash}`);

  const instance = await upgrades.deployProxy(
    factory,
    [
      paymentToken,
      znsHub,
      platformWallet,
      rootPrices,
      platformFee

    ],
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
