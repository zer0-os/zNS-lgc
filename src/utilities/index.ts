import logdown from "logdown";
import * as fs from "fs";
import * as hre from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

export const deploymentsFolder = "./deployments";

export interface DeployedContract {
  name: string;
  address: string;
  version: string;
  implementation?: string;
  date?: string;
}

export interface DeploymentOutput {
  registrar?: DeployedContract;
  basicController?: DeployedContract;
  authController?: DeployedContract;
  stakingController?: DeployedContract;
}

const root = "zns";

export const getLogger = (title: string): logdown.Logger => {
  const logger = logdown(`${root}::${title}`);
  logger.state.isEnabled = true;
  return logger;
};

export const getDeploymentData = (network: string): DeploymentOutput => {
  const filepath = `${deploymentsFolder}/${network}.json`;
  const fileExists = fs.existsSync(filepath);

  if (!fileExists) {
    throw new Error(`No deployment data for ${network}`);
  }

  const fileContents = fs.readFileSync(filepath);
  const data = JSON.parse(fileContents.toString()) as DeploymentOutput;

  return data;
};

let wordsCache: string[] = [];

const fetchWords = (): string[] => {
  if (wordsCache.length) {
    return wordsCache;
  }

  wordsCache = fs
    .readFileSync(`${__dirname}/wordlist.txt`)
    .toString()
    .split("\n")
    .map((e) => e.trim());

  return wordsCache;
};

export const getWords = (): string[] => {
  const words = fetchWords();
  return words;
};

export const getWord = (index: number): string => {
  const words = fetchWords();
  const chosenWord = words[index % words.length];
  return chosenWord;
};

export const impersonateAccount = async (
  address: string
): Promise<SignerWithAddress> => {
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [address],
  });

  await hre.network.provider.send("hardhat_setBalance", [
    address,
    "0x56BC75E2D63100000", // some big number
  ]);

  const account = await hre.ethers.getSigner(address);

  return account;
};
