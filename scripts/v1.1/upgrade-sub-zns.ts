import * as hre from "hardhat";
import {
  Registrar,
  Registrar__factory,
  ZNSHub__factory,
} from "../../typechain";

const hubAddress = "0x90098737eB7C3e73854daF1Da20dFf90d521929a";
const deployerWallet = "0x7829Afa127494Ca8b4ceEF4fb81B78fEE9d0e471";

const main = async () => {
  let deployer = (await hre.ethers.getSigners())[0];

  if (deployer.address != deployerWallet) {
    throw Error(
      `Deployer address is not the expected address! ${deployer.address} != ${deployerWallet}`
    );
  }

  const hub = ZNSHub__factory.connect(hubAddress, deployer);
  const beacon = await hub.beacon();
  console.log(beacon);

  await hre.upgrades.upgradeBeacon(beacon, new Registrar__factory(deployer));
};

main().catch(console.error);
