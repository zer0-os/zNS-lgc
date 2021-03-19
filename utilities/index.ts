import logdown from "logdown";
import * as fs from "fs";

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
