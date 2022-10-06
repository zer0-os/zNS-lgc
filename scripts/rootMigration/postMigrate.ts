import { ethers, upgrades, run } from "hardhat";
import * as hre from "hardhat"
import { runSimulation } from "./actions/runSimulation";
import { getAddressesForNetwork } from "./actions/addresses";
import { Registrar__factory } from "../../typechain";

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
  await run("compile");
  const addresses = getAddressesForNetwork(hre.network.name);

  // 6. Upgrade legacy registrar with required code changes
  hre.upgrades.upgradeProxy(addresses.legacyRegistrar, new Registrar__factory());
}

migrate();