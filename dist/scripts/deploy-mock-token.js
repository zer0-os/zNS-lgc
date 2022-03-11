"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
const typechain_1 = require("../typechain");
const utilities_1 = require("../utilities");
const upgrades_core_1 = require("@openzeppelin/upgrades-core");
const logger = utilities_1.getLogger("scripts::deploy-mock-token");
async function main() {
    await hardhat_1.run("compile");
    const accounts = await hardhat_1.ethers.getSigners();
    const deploymentAccount = accounts[0];
    logger.log(`Deploying to ${hardhat_1.network.name}`);
    logger.log(`'${deploymentAccount.address}' will be used as the deployment account`);
    const factory = new typechain_1.MockToken__factory(deploymentAccount);
    const bytecodeHash = upgrades_core_1.hashBytecodeWithoutMetadata(factory.bytecode);
    logger.log(`Implementation version is ${bytecodeHash}`);
    const instance = await hardhat_1.upgrades.deployProxy(factory, ["Mock Wild", "mWILD"], {
        initializer: "initialize",
    });
    await instance.deployed();
    logger.log(`Deployed to '${instance.address}'`);
    const ozUpgradesManifestClient = await upgrades_core_1.Manifest.forNetwork(hardhat_1.network.provider);
    const manifest = await ozUpgradesManifestClient.read();
    const implementationContract = manifest.impls[bytecodeHash];
    if (implementationContract) {
        logger.log(`Waiting for 5 confirmations`);
        if (hardhat_1.network.name !== "hardhat" && hardhat_1.network.name !== "homestead") {
            await instance.deployTransaction.wait(5); // infinite loops on homestead / hardhat network
        }
        logger.log(`Attempting to verify implementation contract with etherscan`);
        try {
            await hardhat_1.run("verify:verify", {
                address: implementationContract.address,
                constructorArguments: [],
            });
        }
        catch (e) {
            logger.error(`Failed to verify contract: ${e}`);
        }
    }
}
main();
