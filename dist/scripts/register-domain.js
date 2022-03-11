"use strict";
// Utility to register a ZNS domain using a basic controller
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
const helpers_1 = require("../test/helpers");
const logger = utilities_1.getLogger("scripts::register-domain");
const parentId = hardhat_1.ethers.constants.HashZero;
const domainName = "wilder";
const domainMetadata = "https://ipfs.io/ipfs/QmTH2eNVXmeyxPBG1kQaeTcueBiv34FpGzE29indvtqYgp";
const domainOwner = "0x37358Aa5D051B434C23Bad744E56E6A484107272";
async function main() {
    const accounts = await hardhat_1.ethers.getSigners();
    const deploymentAccount = accounts[0];
    console.log(`account ${deploymentAccount} is being used`);
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
    if (!deploymentData.basicController) {
        logger.error(`is not deployed.`);
        process.exit(1);
    }
    const controllerFactory = new typechain_1.BasicController__factory(deploymentAccount);
    const controller = await controllerFactory.attach(deploymentData.basicController.address);
    logger.debug(`Targeting controller at ${controller.address}`);
    logger.debug(`Using account ${deploymentAccount.address}`);
    logger.debug(`Registering subdomain '${domainName}' on parent '${parentId}'`);
    const tx = await controller.registerSubdomainExtended(parentId, domainName, domainOwner, domainMetadata, 0, false);
    logger.debug(`waiting to mine...`);
    const event = await helpers_1.getEvent(tx, "DomainCreated", typechain_1.Registrar__factory.connect(deploymentAccount.address, deploymentAccount));
    logger.log(`Created domain id: ${event.args["id"]}`);
}
main();
