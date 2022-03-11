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
const registrarAddress = "0xc2e9678A71e50E5AEd036e00e9c5caeb1aC5987D";
const updateFilePath = "./domainsToUpdate_test.json";
const checkpointFilePath = "./domainUpdateCheckpoint.json";
const preCheckpointFilePath = "./pre-domainUpdateCheckpoint.json";
const chunkSize = 100; // domains to update at a time
const saveCheckpoint = (checkpoint, pre) => {
    const path = pre ? preCheckpointFilePath : checkpointFilePath;
    fs.writeFileSync(path, JSON.stringify(checkpoint));
};
const loadCheckpoint = () => {
    try {
        const checkpoint = JSON.parse(fs.readFileSync(checkpointFilePath).toString());
        return checkpoint;
    }
    catch (e) {
        console.warn(`No checkpoint file?`);
        return {};
    }
};
const loadUpdateFile = () => {
    const toUpdate = JSON.parse(fs.readFileSync(updateFilePath).toString());
    return {
        domains: toUpdate,
    };
};
const main = async () => {
    const signers = await hardhat_1.ethers.getSigners();
    const deployer = signers[0];
    const instance = typechain_1.RegistrarWheelsFix__factory.connect(registrarAddress, deployer);
    const manifest = loadUpdateFile();
    const checkpoint = loadCheckpoint();
    const domainsToUpdate = [];
    for (const domain of manifest.domains) {
        if (checkpoint[domain.id]) {
            console.log(`skipping ${domain.id}`);
            continue;
        }
        domainsToUpdate.push(domain);
    }
    console.log(`There are ${domainsToUpdate.length} domains to update`);
    const chunks = [];
    let temp;
    let i, j;
    for (i = 0, j = domainsToUpdate.length; i < j; i += chunkSize) {
        temp = domainsToUpdate.slice(i, i + chunkSize);
        chunks.push(temp);
    }
    console.log(`There are ${chunks.length} chunks`);
    for (const { index, chunk } of chunks.map((chunk, index) => ({
        index,
        chunk,
    }))) {
        const nonce = await deployer.getTransactionCount();
        const domainIds = [];
        const metadataChunk1 = [];
        const metadataChunk2 = [];
        for (const domain of chunk) {
            domainIds.push(domain.id);
            const ipfsHash = domain.metadataUri.replace("ipfs://Qm", "");
            const uriAsBytes = hardhat_1.ethers.utils.toUtf8Bytes(ipfsHash);
            metadataChunk1.push(uriAsBytes.slice(0, 12));
            metadataChunk2.push(uriAsBytes.slice(12, uriAsBytes.length));
        }
        console.log(`nonce is ${nonce}?`);
        console.log(`sending chunk ${index}...`);
        const tx = await instance.fixDomainMetadata(domainIds, metadataChunk1, metadataChunk2, {
            nonce,
        });
        for (const domain of domainIds) {
            console.log(domain);
            checkpoint[domain] = true;
        }
        saveCheckpoint(checkpoint, true);
        console.log(`waiting for tx to confirm`);
        console.debug(`tx hash is: ${tx.hash}`);
        await tx.wait(4);
        console.log(`finished sending chunk`);
        saveCheckpoint(checkpoint, false);
    }
};
main();
