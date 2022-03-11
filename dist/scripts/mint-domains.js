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
const hardhat = __importStar(require("hardhat"));
const typechain_1 = require("../typechain");
const fs = __importStar(require("fs"));
const basicControllerAddress = "0xa05Ae774Da859943B7B859cd2A6aD9F5f1651d6a";
const parentDomainId = "0x68975dd5a9af8e36c74f770836840e20ba1a15ca1114837fd5c54eca9a4d3533";
const domainsToMintFilepath = "./domainsToMint.json";
const main = async () => {
    const signers = await hardhat.ethers.getSigners();
    const deployer = signers[0];
    const instance = typechain_1.BasicController__factory.connect(basicControllerAddress, deployer);
    const domainsToMint = JSON.parse(fs.readFileSync(domainsToMintFilepath).toString());
    for (const [label, metadata] of Object.entries(domainsToMint)) {
        console.log(`minting .${label}`);
        try {
            const tx = await instance.registerSubdomainExtended(parentDomainId, label, deployer.address, metadata, 0, true);
            console.log(`tx hash: ${tx.hash}`);
            console.log(`Waiting to be confirmed...`);
            await tx.wait(2);
        }
        catch (e) {
            console.error(`Failed to mint .${label}: ${e}`);
        }
    }
    console.log(`finished`);
};
main();
