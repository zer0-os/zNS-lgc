import * as hre from "hardhat";
import { Registrar__factory, ZNSHub__factory } from "../../typechain";

const registrarAddress = "0xc2e9678A71e50E5AEd036e00e9c5caeb1aC5987D";
const hubAddress = "0x3F0d0a0051D1E600B3f6B35a07ae7A64eD1A10Ca";

const deployerAddress = "0x7829Afa127494Ca8b4ceEF4fb81B78fEE9d0e471";

const main = async () => {
  let deployer = (await hre.ethers.getSigners())[0];

  if ((await hre.ethers.provider.getNetwork()).chainId == 31337) {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [deployerAddress],
    });

    deployer = await hre.ethers.getSigner(deployerAddress);

    await hre.network.provider.send("hardhat_setBalance", [
      deployerAddress,
      "0x56BC75E2D63100000", // some big number
    ]);
  }

  if (deployer.address != deployerAddress) {
    throw Error(`Wrong deployer key; ${deployer.address}`);
  }

  const hub = ZNSHub__factory.connect(hubAddress, deployer);
  const beaconAddress = await hub.beacon();

  console.log(`ZNS Registrar beacon is at ${beaconAddress}`);

  console.log(`Upgrading zNS Hub`);
  await hre.upgrades.upgradeProxy(hubAddress, new ZNSHub__factory(deployer));
  console.log(`finished....`);

  console.log(`Upgrading root zNS Registrar`);
  await hre.upgrades.upgradeProxy(
    registrarAddress,
    new Registrar__factory(deployer)
  );
  console.log(`finished....`);

  console.log(`Upgrading zNS Sub-Registrar Beacon`);
  await hre.upgrades.upgradeBeacon(
    beaconAddress,
    new Registrar__factory(deployer)
  );
  console.log(`finished....`);
};

main().catch(console.error);
