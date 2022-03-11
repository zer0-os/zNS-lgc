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
const logger = utilities_1.getLogger("scripts::add-staking-controller");
async function main() {
    await hardhat_1.run("compile");
    const accounts = await hardhat_1.ethers.getSigners();
    const deploymentAccount = accounts[0];
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
    if (!deploymentData.registrar || !deploymentData.stakingController) {
        logger.error(`Registrar and Controller are not deployed.`);
        process.exit(1);
    }
    const registrarFactory = new typechain_1.Registrar__factory(deploymentAccount);
    const registrar = await registrarFactory.attach(deploymentData.registrar.address);
    logger.log(`Targeting Registrar at ${registrar.address}`);
    const registrarOwner = await registrar.owner();
    if (registrarOwner.toLocaleLowerCase() !=
        deploymentAccount.address.toLocaleLowerCase()) {
        logger.error(`No access on registrar to add controller!`);
        process.exit(1);
    }
    const controllerFactory = new typechain_1.StakingController__factory(deploymentAccount);
    const controller = await controllerFactory.attach(deploymentData.stakingController.address);
    const alreadyController = await registrar.controllers(controller.address);
    if (alreadyController) {
        logger.error(`${controller.address} is already a controller`);
        return;
    }
    logger.log(`Adding ${controller.address} as a controller.`);
    await registrar.addController(controller.address);
}
main();
