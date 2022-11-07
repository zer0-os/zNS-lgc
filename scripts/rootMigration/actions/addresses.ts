// We also have to make sure to update the parent domainId right?
const addresses = {
  mainnet: {
    zNSHub: "0x3F0d0a0051D1E600B3f6B35a07ae7A64eD1A10Ca",
    registrar: "0xc2e9678A71e50E5AEd036e00e9c5caeb1aC5987D",
    subregistrarBeacon: "0x4CD06F23e9Cc5658acCa6D5d681511f3d5616bc9",
    wilderDomainId: "0x196c0a1e30004b9998c97b363e44f1f4e97497e59d52ad151208e9393d70bb3b"
  },
  goerli: {
    zNSHub: "0xce1fE2DA169C313Eb00a2bad25103D2B9617b5e1",
    registrar: "0x009A11617dF427319210e842D6B202f3831e0116",
    subregistrarBeacon: "0x9e20B753d87c4B6632394566EcbE7453B5404871",
    wilderDomainId: "0x196c0a1e30004b9998c97b363e44f1f4e97497e59d52ad151208e9393d70bb3b"
  }
}

// Use Rinkeby addresses for hardhat testing locally
export const getAddressesForNetwork = (network: string) => {
  if (network === "mainnet") {
    return addresses.mainnet;
  } else if (network === "goerli" || network === "hardhat") {
    return addresses.goerli
  } else {
    throw Error(`Network '${network}' not supported.`);
  }
}