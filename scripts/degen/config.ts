interface RootDomainConfig {
  /**
   * When burning root domains, parent registrar is the registrar contract
   * where the root domains(0://degen, 0://dgen) will be burning out.
   * When creating root domains, parent registrar is the registrar contract
   * where all the root domains(0://wilder, 0://degen, 0://dgen) exist.
   */
  parentRegistrar?: string | undefined;
  id: string;
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
      parentRegistrar: "0xfE7531615E2920ACC7c9D334C50796Ea0508d868",
      id: "0x956c1ec74b03071bf0d1cc37111b273fea8891f21e35345e71f43fccf8763059",
      label: "degen",
      metadataUri: "ipfs://Qmbc8XR1BrxRFGLv7DnaGiTc4RnNYdgHB3K9JTzT8kQmSR",
      minter: "0x35888AD3f1C0b39244Bb54746B96Ee84A5d97a53",
    },
    dgen: {
      parentRegistrar: "0xfE7531615E2920ACC7c9D334C50796Ea0508d868",
      id: "0x36ff35c14a87ae7c0727e52c93fc3c0d3ef5c61578c9109a1e94468a17e5d6b2",
      label: "dgen",
      metadataUri: "ipfs://Qmbc8XR1BrxRFGLv7DnaGiTc4RnNYdgHB3K9JTzT8kQmSR",
      minter: "0x35888AD3f1C0b39244Bb54746B96Ee84A5d97a53",
    },
  },
  mainnet: {
    degen: {
      parentRegistrar: "",
      id: "0x956c1ec74b03071bf0d1cc37111b273fea8891f21e35345e71f43fccf8763059",
      label: "degen",
      metadataUri: "",
      minter: "",
    },
    dgen: {
      parentRegistrar: "",
      id: "0x36ff35c14a87ae7c0727e52c93fc3c0d3ef5c61578c9109a1e94468a17e5d6b2",
      label: "dgen",
      metadataUri: "",
      minter: "",
    },
  },
};
