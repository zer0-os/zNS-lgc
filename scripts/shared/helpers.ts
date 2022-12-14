import Safe from "@gnosis.pm/safe-core-sdk";
import { SafeTransactionDataPartial } from "@gnosis.pm/safe-core-sdk-types";
import EthersAdapter from "@gnosis.pm/safe-ethers-lib";
import SafeServiceClient from "@gnosis.pm/safe-service-client";
import { Contract, ethers } from "ethers";
import { run } from "hardhat";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { config, EthereumNetwork } from "./config";

export const sleep = (m: number): Promise<void> =>
  new Promise((r) => setTimeout(r, m));

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

export const proposeTransaction = async (
  network: EthereumNetwork,
  safeAddress: string,
  contract: Contract,
  methodName: string,
  params: string[],
  moduleInterface: ethers.utils.Interface,
  signer: ethers.Signer
) => {
  const ethAdapter = new EthersAdapter({ ethers, signerOrProvider: signer });
  const safe = await Safe.create({ ethAdapter, safeAddress });
  const safeService = new SafeServiceClient({
    txServiceUrl: config.gnosisSafeServiceUrl[network],
    ethAdapter,
  });

  const data = moduleInterface.encodeFunctionData(methodName, params);
  const allTransactions = await safeService.getMultisigTransactions(
    safe.getAddress()
  );
  const num =
    allTransactions.count === 0 ? 1 : allTransactions.results[0].nonce + 1;
  const transaction: SafeTransactionDataPartial = {
    to: contract.address,
    data: data,
    value: "0",
    operation: 0, // Optional
    safeTxGas: 0, // Optional
    baseGas: 0, // Optional
    gasPrice: 0, // Optional
    gasToken: "0x0000000000000000000000000000000000000000", // Optional
    refundReceiver: "0x0000000000000000000000000000000000000000", // Optional
    nonce: num, // Optional
  };
  const safeTransaction = await safe.createTransaction({
    safeTransactionData: transaction,
  });
  const safeTransactionHash = await safe.getTransactionHash(safeTransaction);
  const safeTxHash = await safe.signTransactionHash(safeTransactionHash);
  await safeService.proposeTransaction({
    safeAddress: safe.getAddress(),
    safeTransactionData: safeTransaction.data,
    safeTxHash: safeTransactionHash,
    senderAddress: await signer.getAddress(),
    senderSignature: safeTxHash.data,
  });
};
