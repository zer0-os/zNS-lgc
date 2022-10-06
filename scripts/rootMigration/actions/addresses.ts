
const addresses = {
  mainnet: {
    hubBeaconProxy: "0x4CD06F23e9Cc5658acCa6D5d681511f3d5616bc9", // Beacon, for hub // need? don't think so
    zNSHub: "0x3F0d0a0051D1E600B3f6B35a07ae7A64eD1A10Ca", // Transparent, no upgrade
    legacyRegistrar: "0xc2e9678A71e50E5AEd036e00e9c5caeb1aC5987D", // Transparent, upgrade
    airWildSeason2: "0x35D2F3CDAf5e2DeA9e6Ae3553A4CaACBA860A395", // Beacon, parent: legacy above
    beasts: "0x1A178CFD768F74b3308cbca9998C767F4E5B2CF8", // Beacon, parent: 1aE8 below
    beastsBeacon: "0x23682326C87D079F73bd88402efD341E07731aE8" // Beacon, parent: legacy above
  },
  rinkeby: {
    hubBeaconProxy: "0x366e9e375b772A6fe1141E5dC02A99da8EAfB1D7", // no upgrade probably
    zNSHub: "0x90098737eB7C3e73854daF1Da20dFf90d521929a", // no upgrade
    legacyRegistrar: "0xa4F6C921f914ff7972D7C55c15f015419326e0Ca",
    airWildSeason2: "", // Have props for intellisense when consuming
    beasts: "",
    beastsBeacon: ""
  }
}

// Use Rinkeby addresses for hardhat testing locally
export const getAddressesForNetwork = (network: string) => {
  if (network === "mainnet") {
    return addresses.mainnet;
  } else if (network === "rinkeby" || network === "hardhat") {
    return addresses.rinkeby
  } else {
    throw Error(`Network '${network}' not supported.`);
  }
}