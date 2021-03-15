import { ethers, network } from "hardhat";
import { getLogger } from "../utilities";

const logger = getLogger("scripts::send-eth");

async function main() {
  if (network.name != "kovan") {
    logger.error(
      `Only kovan network is supported when simulating an environment.`
    );
    return;
  }

  const accounts = await ethers.getSigners();

  logger.log(`Distributing eth to test accounts from ${accounts[0].address}`);
  logger.log(`This may take some time to complete...`);

  let numTestAccounts = accounts.length;
  numTestAccounts = 7;

  for (let i = 1; i < numTestAccounts; ++i) {
    let amountToGive = ethers.utils.parseEther("1");
    if (i === i) {
      amountToGive = ethers.utils.parseEther("5");
    }

    logger.log(`Sending ${amountToGive} eth to ${accounts[i].address}`);

    await accounts[0].sendTransaction({
      from: accounts[0].address,
      to: accounts[i].address,
      value: amountToGive,
      gasPrice: ethers.utils.parseUnits("15", "gwei"),
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
