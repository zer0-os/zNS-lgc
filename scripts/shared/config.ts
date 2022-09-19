type ethereumNetwork = "goerli" | "rinkeby" | "mainnet";

interface EthereumConfig {
  zNSHub: string;
}

const resolverConfig: { [key in ethereumNetwork]: EthereumConfig } = {
  goerli: {
    zNSHub: "0x9a35367c5e8C01cd009885e497a33a9761938832", // todo
  },
  rinkeby: {
    zNSHub: "0x90098737eB7C3e73854daF1Da20dFf90d521929a", // todo
  },
  mainnet: {
    zNSHub: "0x6141d5cb3517215a03519a464bf9c39814df7479",
  },
};

export const config = {
  ...resolverConfig,
};
