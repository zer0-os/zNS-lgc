import * as hre from "hardhat";
import { Registrar__factory, ZNSHub__factory } from "../../typechain";

// mainnet Hub
const hubAddress = "0x3F0d0a0051D1E600B3f6B35a07ae7A64eD1A10Ca";

const main = async () => {
  let deployer = (await hre.ethers.getSigners())[0];

  await hre.upgrades.upgradeProxy(hubAddress, new ZNSHub__factory(deployer));
};

main().catch(console.error);
