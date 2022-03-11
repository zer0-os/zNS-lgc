"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
async function main() {
    await hardhat_1.run("compile");
    const proxy = "0x1188dD1a0F42BA4a117EF1c09D884f5183D40B28";
    const factory = await hardhat_1.ethers.getContractFactory("BasicController");
    console.log("upgrading");
    await hardhat_1.upgrades.upgradeProxy(proxy, factory);
    console.log("upgraded");
}
main();
