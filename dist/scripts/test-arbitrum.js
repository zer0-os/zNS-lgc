"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
const BasicController_json_1 = __importDefault(require("../artifacts/contracts/BasicController.sol/BasicController.json"));
const Registrar_json_1 = __importDefault(require("../artifacts/contracts/Registrar.sol/Registrar.json"));
const main = async () => {
    const registrarAbi = Registrar_json_1.default.abi;
    const basicControllerAbi = BasicController_json_1.default.abi;
    const registrarAddress = "0xdDd0516188a2240c864AAd7E95FF832038fa7804";
    const basicControllerAddress = "0x767f026bF6d2146d31889B3c4F9E489DBb88aadc";
    const stakingControllerAddress = "0x53EF64F91e0d2f4577807f39760d2D266011cd40";
    const signers = await hardhat_1.ethers.getSigners();
    const deployer = signers[0];
    // Typing gives us intellisense
    const registrar = new hardhat_1.ethers.Contract(registrarAddress, registrarAbi, deployer);
    const basicController = new hardhat_1.ethers.Contract(basicControllerAddress, basicControllerAbi, deployer);
    // Only have to call init once for each contract
    try {
        const controllers = await registrar.controllers();
        // const tx = await registrar.addController(basicController.address);
        console.log(controllers);
        // if (isPaused) {
        //   const tx = await registrar.connect(deployer).unpause();
        //   await tx.wait(3);
        // }
    }
    catch (e) {
        console.log(e);
    }
    // get root domain
    // const records = await registrar.records(ethers.BigNumber.from("0"));
    // console.log(records);
    const tx = await basicController.registerSubdomainExtended(hardhat_1.ethers.BigNumber.from("0"), "another.label", await deployer.getAddress(), "ipfs://no-metadata", 5, false);
    await tx.wait(3);
    console.log(tx);
};
main();
