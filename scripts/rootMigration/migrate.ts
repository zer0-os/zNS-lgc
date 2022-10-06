// import { ethers, upgrades, run } from "hardhat";
import * as hre from "hardhat"
import { runSimulation } from "./actions/runSimulation";
import { getAddressesForNetwork } from "./actions/addresses";
import {
  MigrationRegistrar,
  MigrationRegistrar__factory,
  Registrar,
  Registrar__factory,
} from "../../typechain";

// 0. Make code changes for migration registrar, version M
//    0a. Make this a new version, maintain the old version, PM, for post migration
// 1. Upgrade registrars with required code changes
// 2. Burn 0:// and 0://wilder on legacy registrar
// 3. Deploy new root registrar (beacon proxy)
// 4. Mint 0://wilder (we will not remint the root 0://)
// 5. Update `rootDomainId` and `parentRegistrar` on legacy registrar
//    5a. Make these values point to the newly minted 0://wilder domain on beacon
// 6. Upgrade both the legacy registrar and new beacon to have the old registrar code (PM)

const migrate = async () => {
  // await run("compile");

  // As beasts and air wild season2 sales only happened on mainnet they can't be tested on rinkeby 
  // unless we deploy a fake contract to act as the sale contract when testing. For now just test
  // on registrar that does exist on rinkeby

  const [signer] = await hre.ethers.getSigners();

  // run simulation on hardhat
  if (hre.network.name === "hardhat") {
    runSimulation(signer);
  } else {
    const signerAddress = await signer.getAddress();
    const addresses = getAddressesForNetwork(hre.network.name);
    console.log(hre.network.name)
  }


}

migrate();