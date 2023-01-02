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
      metadataUri: "ipfs://Qmbc8XR1BrxRFGLv7DnaGiTc4RnNYdgHB3K9JTzT8kQmSR",
      minter: "0x35888AD3f1C0b39244Bb54746B96Ee84A5d97a53",
    },
    dgen: {
      label: "dgen",
      metadataUri: "ipfs://Qmbc8XR1BrxRFGLv7DnaGiTc4RnNYdgHB3K9JTzT8kQmSR",
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
