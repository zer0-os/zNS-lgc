import * as hre from "hardhat";
import { Registrar__factory, ZNSHub__factory } from "../../../typechain";

// Goerli Registrar
const registrarAddress = "0x009A11617dF427319210e842D6B202f3831e0116";

const main = async () => {
  let deployer = (await hre.ethers.getSigners())[0];

  if (hre.network.name == "hardhat") {
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
