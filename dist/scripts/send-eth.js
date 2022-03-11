"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
const utilities_1 = require("../utilities");
const logger = utilities_1.getLogger("scripts::send-eth");
async function main() {
    if (hardhat_1.network.name != "kovan") {
        logger.error(`Only kovan network is supported when simulating an environment.`);
        return;
    }
    const accounts = await hardhat_1.ethers.getSigners();
    logger.log(`Distributing eth to test accounts from ${accounts[0].address}`);
    logger.log(`This may take some time to complete...`);
    let numTestAccounts = accounts.length;
    numTestAccounts = 7;
    for (let i = 1; i < numTestAccounts; ++i) {
        let amountToGive = hardhat_1.ethers.utils.parseEther("1");
        if (i === i) {
            amountToGive = hardhat_1.ethers.utils.parseEther("3");
        }
        logger.log(`Sending ${amountToGive} eth to ${accounts[i].address}`);
        await accounts[0].sendTransaction({
            from: accounts[0].address,
            to: accounts[i].address,
            value: amountToGive,
            gasPrice: hardhat_1.ethers.utils.parseUnits("15", "gwei"),
        });
    }
}
main()
    .then(() => {
    process.exit(0);
})
    .catch((e) => {
    logger.error(`Failed to create simulated environment: ${e}`);
    process.exit(1);
});
