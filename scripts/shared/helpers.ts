import { run } from "hardhat";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { ethers } from "ethers";
import { exit } from "process";

export const sleep = (m: number): Promise<void> => new Promise((r) => setTimeout(r, m));

export const verifyContract = async (
  address: string,
  constructorArguments: unknown[] = []
): Promise<void> => {
  try {
    console.log("Sleeping for 10 seconds before verification...");
    await sleep(10000);
    console.log("\n>>>>>>>>>>>> Verification >>>>>>>>>>>>\n");

    console.log("Verifying: ", address);
    await run("verify:verify", {
      address,
      constructorArguments,
    });
  } catch (error) {
    if (
      error instanceof NomicLabsHardhatPluginError &&
      error.message.includes("Reason: Already Verified")
    ) {
      console.log("Already verified, skipping...");
    } else {
      console.error(error);
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

export const confirmContinue = () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const input = require("cli-interact").getYesNo;
  const val: boolean = input(`Proceed?`);

  if (!val) {
    exit();
  }
};
