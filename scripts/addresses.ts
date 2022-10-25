export interface ZNSAddresses {
  registrar: string;
  hub: string;
  deployer: string;
  zeroToken: string;
  wildToken: string;
}

export interface NetworkToZNSAddresses {
  [network: string]: ZNSAddresses;
}

export const zNSAddressesByNetwork: NetworkToZNSAddresses = {
  mainnet: {
    registrar: "0xc2e9678A71e50E5AEd036e00e9c5caeb1aC5987D",
    hub: "0x3F0d0a0051D1E600B3f6B35a07ae7A64eD1A10Ca",
    deployer: "0x7829Afa127494Ca8b4ceEF4fb81B78fEE9d0e471",
    zeroToken: "0x0eC78ED49C2D27b315D462d43B5BAB94d2C79bf8",
    wildToken: "0x2a3bFF78B79A009976EeA096a51A948a3dC00e34",
  },
  rinkeby: {
    registrar: "0xa4F6C921f914ff7972D7C55c15f015419326e0Ca",
    hub: "0x90098737eB7C3e73854daF1Da20dFf90d521929a",
    deployer: "0x35888AD3f1C0b39244Bb54746B96Ee84A5d97a53",
    // same token as WILD on rinkeby
    zeroToken: "0x3Ae5d499cfb8FB645708CC6DA599C90e64b33A79",
    wildToken: "0x3Ae5d499cfb8FB645708CC6DA599C90e64b33A79",
  },
};

export const getZNSAddressesByNetworkName = (networkName: string) => {
  if (networkName === "hardhat") {
    networkName = "mainnet";
  }

  const addresses = zNSAddressesByNetwork[networkName];

  return addresses;
};
