
import { zer0ProtocolAddresses } from "@zero-tech/zero-contracts";

import { EthereumNetwork } from "../shared/config";

interface RootDomainConfig {
  /**
   * Current Registrar(before root migration) has root domains(0://wilder,
   *  0://degen, 0://dgen).
   * Burning root domains should be executed before root migration and current
   *  Registrar will be `parentRegistr`.
   * 
   * After root migration, all the root domains will be located in the root
   *  Registrar.
   * When re-minting domains, this has the root Registrar as parentRegistrar.
   */
  parentRegistrar?: string | undefined;
  id: string;
  label: string;
  minter: string;
  metadataUri: string;
}

type RootDomainConfigs = {
  [network in EthereumNetwork]: {
    [domain: string]: RootDomainConfig;
  };
};

export const domainConfigs: RootDomainConfigs = {
  goerli: {
    degen: {
      parentRegistrar: zer0ProtocolAddresses['goerli']!.zNS.registrar!,
      id: "0x956c1ec74b03071bf0d1cc37111b273fea8891f21e35345e71f43fccf8763059",
      label: "degen",
      metadataUri: "ipfs://Qmbc8XR1BrxRFGLv7DnaGiTc4RnNYdgHB3K9JTzT8kQmSR",
      minter: "0x35888AD3f1C0b39244Bb54746B96Ee84A5d97a53",
    },
    dgen: {
      parentRegistrar: zer0ProtocolAddresses['goerli']!.zNS.registrar!,
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
