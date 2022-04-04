import * as hre from "hardhat";
import { Registrar__factory, ZNSHub__factory } from "../../typechain";

// Mainnet Registrar
const registrarAddress = "0xc2e9678A71e50E5AEd036e00e9c5caeb1aC5987D";

const main = async () => {
  let deployer = (await hre.ethers.getSigners())[0];

  if (hre.ethers.provider.network.chainId == 31337) {
    const mainnetDeployer = "0x7829afa127494ca8b4ceef4fb81b78fee9d0e471";

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

  // Deploy the zNS Registrar Beacon
  console.log(`deploying beacon`);
  const beacon = await hre.upgrades.deployBeacon(
    new Registrar__factory(deployer)
  );
  console.log(`beacon deployed at ${beacon.address}`);

  // Deploy the zNS Hub
  const hub = await hre.upgrades.deployProxy(new ZNSHub__factory(deployer), [
    registrarAddress,
    beacon.address,
  ]);
  console.log(`Deployed hub to ${hub.address}`);
};

main().catch(console.error);
