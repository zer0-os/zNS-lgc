import { run, network } from "hardhat";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { ethers } from "ethers";
import { getLogger } from "../../utilities";

const logger = getLogger("shared::helpers");

export const sleep = (m: number): Promise<void> => new Promise((r) => setTimeout(r, m));

export const verifyContract = async (
  address: string,
  constructorArguments: unknown[] = []
): Promise<void> => {
  try {
    logger.log("Sleeping for 10 seconds before verification...");
    await sleep(10000);

    logger.log("Verifying: ", address);
    await run("verify:verify", {
      address,
      constructorArguments,
    });
  } catch (error) {
    if (
      error instanceof NomicLabsHardhatPluginError &&
      error.message.includes("Reason: Already Verified")
    ) {
      logger.log(`Contract already verified on ${network.name}, skipping...`);
    } else {
      logger.error(error);
    }
  }
};

// add 10%
export const calculateGasMargin = (
  value: ethers.BigNumber
): ethers.BigNumber => {
  return value
    .mul(ethers.BigNumber.from(10000).add(ethers.BigNumber.from(1000)))
    .div(ethers.BigNumber.from(10000));
};
