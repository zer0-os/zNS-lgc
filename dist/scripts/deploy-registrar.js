"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
const typechain_1 = require("../typechain");
const fs = __importStar(require("fs"));
const utilities_1 = require("../utilities");
const upgrades_core_1 = require("@openzeppelin/upgrades-core");
const logger = utilities_1.getLogger("scripts::deploy-registrar");
async function main() {
    await hardhat_1.run("compile");
    const accounts = await hardhat_1.ethers.getSigners();
    const deploymentAccount = accounts[0];
    logger.log(`Deploying to ${hardhat_1.network.name}`);
    logger.log(`'${deploymentAccount.address}' will be used as the deployment account`);
    const registrarFactory = new typechain_1.Registrar__factory(deploymentAccount);
    const bytecodeHash = upgrades_core_1.hashBytecodeWithoutMetadata(registrarFactory.bytecode);
    logger.log(`Implementation version is ${bytecodeHash}`);
    const instance = await hardhat_1.upgrades.deployProxy(registrarFactory, [], {
        initializer: "initialize",
    });
    await instance.deployed();
    logger.log(`Deployed Registrar to '${instance.address}'`);
    const fileName = `${hardhat_1.network.name}.json`;
    const filepath = `${utilities_1.deploymentsFolder}/${fileName}`;
    let deploymentData;
    try {
        deploymentData = JSON.parse(fs.readFileSync(filepath).toString());
    }
    catch (e) {
        logger.debug(`New deployment for network detected.`);
        deploymentData = {};
    }
    const registrarObject = {
        name: "Registrar",
        address: instance.address,
        version: bytecodeHash,
        date: new Date().toISOString(),
    };
    const ozUpgradesManifestClient = await upgrades_core_1.Manifest.forNetwork(hardhat_1.network.provider);
    const manifest = await ozUpgradesManifestClient.read();
    const implementationContract = manifest.impls[bytecodeHash];
    if (implementationContract) {
        registrarObject.implementation = implementationContract.address;
    }
    deploymentData.registrar = registrarObject;
    const jsonToWrite = JSON.stringify(deploymentData, undefined, 2);
    logger.log(`Updated ${filepath}`);
    fs.mkdirSync(utilities_1.deploymentsFolder, { recursive: true });
    fs.writeFileSync(filepath, jsonToWrite);
    if (implementationContract) {
        logger.log(`Waiting for 3 confirmations`);
        // infinite loops on homestead / hardhat network
        if (hardhat_1.network.name !== "hardhat" && hardhat_1.network.name !== "homestead") {
            await instance.deployTransaction.wait(5);
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
