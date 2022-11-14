// We also have to make sure to update the parent domainId right?
const addresses = {
  mainnet: {
    zNSHub: "0x3F0d0a0051D1E600B3f6B35a07ae7A64eD1A10Ca",
    registrar: "0xc2e9678A71e50E5AEd036e00e9c5caeb1aC5987D",
    registrarOwner: "0x1A1d3644fc9906B1EE3d35842789A83D33e99943",
    subregistrarBeacon: "0x4CD06F23e9Cc5658acCa6D5d681511f3d5616bc9",
    wilderDomainId: "0x196c0a1e30004b9998c97b363e44f1f4e97497e59d52ad151208e9393d70bb3b",
    safe: {
      address: "0x1A1d3644fc9906B1EE3d35842789A83D33e99943",
      multiSendAddress: "0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761",
      multiSendCallOnlyAddress: "0x40A2aCCbd92BCA938b02010E17A5b8929b49130D",
      safeMasterCopyAddress: "0x1A1d3644fc9906B1EE3d35842789A83D33e99943",
      safeProxyFactoryAddress: "0x1A1d3644fc9906B1EE3d35842789A83D33e99943"
    }
  },
  goerli: {
    zNSHub: "0xce1fE2DA169C313Eb00a2bad25103D2B9617b5e1",
    registrar: "0x009A11617dF427319210e842D6B202f3831e0116",
    registrarOwner: "0x7336eF6E88A994182853fFb1fd0A779b16d02945", // does not "own" yet actually
    subregistrarBeacon: "0x9e20B753d87c4B6632394566EcbE7453B5404871",
    wilderDomainId: "0x196c0a1e30004b9998c97b363e44f1f4e97497e59d52ad151208e9393d70bb3b",
    safe: {
      address: "0x7336eF6E88A994182853fFb1fd0A779b16d02945",
      multiSendAddress: "0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761",
      multiSendCallOnlyAddress: "0x40A2aCCbd92BCA938b02010E17A5b8929b49130D",
      safeMasterCopyAddress: "0x7336eF6E88A994182853fFb1fd0A779b16d02945",
      safeProxyFactoryAddress: "0x7336eF6E88A994182853fFb1fd0A779b16d02945",
    }
  }
}

// Use Rinkeby addresses for hardhat testing locally
export const getAddressesForNetwork = (network: string) => {
  if (network === "mainnet") {
    // if (network === "mainnet" || network === "hardhat") {
    return addresses.mainnet;
  } else if (network === "goerli" || network === "hardhat") {
    return addresses.goerli
  } else {
    throw Error(`Network '${network}' not supported.`);
  }
}