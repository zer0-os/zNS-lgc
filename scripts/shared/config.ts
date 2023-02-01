export type EthereumNetwork = "goerli" | "mainnet";

interface EthereumConfig {
  zNSHub: string;
}

const resolverConfig: { [key in EthereumNetwork]: EthereumConfig } = {
  goerli: {
    zNSHub: "0x9a35367c5e8C01cd009885e497a33a9761938832", // todo
  },
  mainnet: {
    zNSHub: "0x6141d5cb3517215a03519a464bf9c39814df7479",
  },
};

const gnosisSafeServiceUrl: { [key in EthereumNetwork]: string } = {
  goerli: "https://safe-transaction.goerli.gnosis.io",
  mainnet: "https://safe-transaction.gnosis.io",
};

export const config = {
  resolverConfig,
  gnosisSafeServiceUrl,
};
