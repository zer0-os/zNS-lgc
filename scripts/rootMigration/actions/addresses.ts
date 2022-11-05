// We also have to make sure to update the parent domainId right?
const addresses = {
  mainnet: {
    zNSHub: "0x3F0d0a0051D1E600B3f6B35a07ae7A64eD1A10Ca",
    registrar: "0xc2e9678A71e50E5AEd036e00e9c5caeb1aC5987D",
    subregistrarBeacon: "0x4CD06F23e9Cc5658acCa6D5d681511f3d5616bc9",
    wilderDomainId: "0x196c0a1e30004b9998c97b363e44f1f4e97497e59d52ad151208e9393d70bb3b",
    subdomains: [
      "0x473c62c6e1cf7a1536c03acac4b785be9012adac109e5a45521661dd1d15db51", // World Origin Wilder
      "0x79e5bdb3f024a898df02a5472e6fc5373e6a3c5f65317f58223a579d518378df", // Kicks
      "0x34476ecdfb5634e431b3309a0330c8e10c09530710e9ff8050312def755a97d7", // Guild
      "0x2c8c7428bc02f30bce3c83a7e781e6e622a3ff37ba4161179bd63b9554799cc8", // Concept
      "0x7445164548beaf364109b55d8948f056d6e4f1fd26aff998c9156b0b05f1641f", // Wheels
      "0xa8bb95e9d1120c8a5f44c7a0507d9656bdd6c0def01fab9fc8f510124fe28ecd", // Cribs
      "0xf68d21d498cb81eba4f25654566040cdf82bc813cc282603ca09948e7010313c", // Craft
      "0x290422f1f79e710c65e3a72fe8dddc0691bb638c865f5061a5e639cf244ee5ed", // Beasts
      "0x45483a3a19b4ce3eb27a6d8e0b4d1eb6561c94af65b268fc1038d45130e65796" // Motos
    ]
  },
  goerli: {
    zNSHub: "0xce1fE2DA169C313Eb00a2bad25103D2B9617b5e1",
    registrar: "0x009A11617dF427319210e842D6B202f3831e0116",
    subregistrarBeacon: "0x9e20B753d87c4B6632394566EcbE7453B5404871",
    wilderDomainId: "0x196c0a1e30004b9998c97b363e44f1f4e97497e59d52ad151208e9393d70bb3b",
    subdomains: [
      "0x391da7f7fe76002965c3e816c87e3955174d41ed8a55420ea556dae78e4a40ea", // boat
      "0x45483a3a19b4ce3eb27a6d8e0b4d1eb6561c94af65b268fc1038d45130e65796", // moto
      "0x520a248123980d3d5746f8d55aac3340ae25a3cc1116be03e06e15f372a9ea94", // tea
      "0x617b3c878abfceb89eb62b7a24f393569c822946bbc9175c6c65a7d2647c5402", // cats
      "0x6e35a7ecbf6b6368bb8d42ee9b3dcfc8404857635036e60196931d4458c07622", // pancakes
      "0x7445164548beaf364109b55d8948f056d6e4f1fd26aff998c9156b0b05f1641f", // wheels
      "0x804272242ccaa9b022763d219b2679d0d1067fe5735a0ba9de2a2537afed08d6", // subcontract0
      "0x81a205879073b617f10e379fbb3558ac869fe9f182b029307f9e216d736dc3f4", // skyydao
      "0xa132a9d9dbdce8c1d0904bf1238e574b59a5ad589bdf7d808f10ce436dd79d31", // mountains
    ]
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