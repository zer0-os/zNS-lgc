interface RootDomainConfig {
  label: string;
  minter: string;
  metadataUri: string;
}

type RootDomainConfigs = {
  [network: string]: {
    [domain: string]: RootDomainConfig;
  };
};

export const domainConfigs: RootDomainConfigs = {
  goerli: {
    degen: {
      label: "degen",
      metadataUri: "ipfs://QmPGRFipDvgcENvPa2dGYT4a4UR9A59FUwrrz4vvR1nTEx",
      minter: "0x35888AD3f1C0b39244Bb54746B96Ee84A5d97a53",
    },
    dgen: {
      label: "dgen",
      metadataUri: "ipfs://QmUUFzmBzLdhLhezWSxKrZLeVhut4naH4Udh7zf97NLQ5M",
      minter: "0x35888AD3f1C0b39244Bb54746B96Ee84A5d97a53",
    },
  },
  mainnet: {
    degen: {
      label: "degen",
      metadataUri: "",
      minter: "",
    },
    dgen: {
      label: "dgen",
      metadataUri: "",
      minter: "",
    },
  },
};
