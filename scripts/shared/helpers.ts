import { run } from "hardhat";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { ethers, Signer } from "ethers";
import { exit } from "process";
import EthersAdapter from '@safe-global/safe-ethers-lib'
import Safe from '@safe-global/safe-core-sdk'
import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import SafeServiceClient from '@safe-global/safe-service-client'
import { config, EthereumNetwork } from "./config";

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

export const confirmContinue = (prompt = 'Proceed?'): void => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const input = require("cli-interact").getYesNo;
  const val: boolean = input(prompt);

  if (!val) {
    exit();
  }
};

const getEthAdapter = (signer: Signer) => {
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer
  });
  return ethAdapter;
}

const getSafeServiceInstance = async (network: EthereumNetwork, signer: Signer) => {
  const ethAdapter = getEthAdapter(signer);
  const txServiceUrl = config.gnosisSafeServiceUrl[network];
  const safeService = new SafeServiceClient({ txServiceUrl, ethAdapter });
  return safeService;

}
const getSafeSdkInstance = async (signer: Signer, safeAddress: string) => {
  const ethAdapter = getEthAdapter(signer);
  const safeSdk = await Safe.create({ ethAdapter, safeAddress });
  return safeSdk;
}

/**
 * Attach to the Gnosis Safe SDK and create the transaction using the given 
 * data before being proposed
 * 
 * @param safeAddress The address of the safe
 * @param signer The transaction signer
 * @param contract The contract executing the given function
 * @param functionName The function to be executed
 * @param params The parameters given to the function to be executed
 */
export const createAndProposeTransaction = async (
  network: EthereumNetwork,
  safeAddress: string,
  signer: Signer,
  contract: ethers.Contract,
  functionName: string,
  params: any[],
): Promise<void> => {
  const safeSdk = await getSafeSdkInstance(signer, safeAddress);

  const functionFragment = contract.interface.functions[functionName];

  if (!functionFragment) {
    throw Error(`Function ${functionName} does not exist on contract at ${contract.address}`)
  }

  const data = contract.interface.encodeFunctionData(
    functionFragment,
    params
  );

  await proposeTransaction(network, safeSdk, signer, contract.address, data);
}

/**
 * @description Propose a transaction to the attached Gnosis safe
 * 
 * @param safeSdk The attached Gnosis safe 
 * @param ethAdapter The ethers adapter used for connecting to the chain
 * @param signer The transaction signer
 * @param to The 'to' address used in the transaction
 * @param data The encoded transaction data, gotten by using the contract interface "encodeFunctionData" function
 */
const proposeTransaction = async (
  network: EthereumNetwork,
  safeSdk: Safe,
  signer: Signer,
  to: string,
  data: string,
) => {
  const safeService = await getSafeServiceInstance(network, signer);

  const nonce = await safeService.getNextNonce(safeSdk.getAddress())

  // Don't add nonce while testing because you can't run simulations on txs that it knows
  // have to follow others based on their nonce
  const safeTransactionData: SafeTransactionDataPartial = {
    to: to,
    data: data,
    value: "0",
    gasPrice: 0, // optional
    safeTxGas: 0,
    nonce: nonce
  }

  const safeTx = await safeSdk.createTransaction({ safeTransactionData });
  const safeTxHash = await safeSdk.getTransactionHash(safeTx);
  const signedSafeTxHash = await safeSdk.signTransactionHash(safeTxHash);

  await safeService.proposeTransaction({
    safeAddress: safeSdk.getAddress(),
    safeTransactionData: safeTx.data,
    safeTxHash: safeTxHash,
    senderAddress: await signer.getAddress(),
    senderSignature: signedSafeTxHash.data,
  });
}