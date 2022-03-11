"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
async function main() {
    const accounts = await hardhat_1.ethers.getSigners();
    const signer = accounts[0];
    await signer.sendTransaction({
        to: signer.address,
        value: 0,
        nonce: 62,
        gasPrice: 100000000000,
    });
}
main();
