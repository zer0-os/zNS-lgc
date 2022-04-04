import * as hre from "hardhat";
import { Registrar__factory } from "../typechain";

/*

This script will upgrade zNS Registrars

*/

// Mainnet Registrar
const registrarAddress = "0xc2e9678A71e50E5AEd036e00e9c5caeb1aC5987D";
const beaconAddress = "0x4CD06F23e9Cc5658acCa6D5d681511f3d5616bc9";
const mainnetDeployer = "0x7829afa127494ca8b4ceef4fb81b78fee9d0e471";

const main = async () => {
  let deployer = (await hre.ethers.getSigners())[0];

  console.log(`Deployer is ${deployer.address}`);

  if (deployer.address.toLowerCase() != mainnetDeployer.toLowerCase()) {
    throw Error(`Wrong deployment account!`);
  }

  if ((await hre.ethers.provider.getNetwork()).chainId == 31337) {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [mainnetDeployer],
    });

    deployer = await hre.ethers.getSigner(mainnetDeployer);

    await hre.network.provider.send("hardhat_setBalance", [
      mainnetDeployer,
      "0x56BC75E2D63100000", // some big number
    ]);
  }

  console.log(`upgrading root registrar`);
  await hre.upgrades.upgradeProxy(
    registrarAddress,
    new Registrar__factory(deployer)
  );

  console.log(`upgrading registrar beacon (sub zns registrars)`);
  await hre.upgrades.upgradeBeacon(
    beaconAddress,
    new Registrar__factory(deployer)
  );
};

main().catch(console.error);
