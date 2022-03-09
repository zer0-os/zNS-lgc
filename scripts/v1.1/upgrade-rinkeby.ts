import * as hre from "hardhat";
import { Registrar__factory, ZNSHub__factory } from "../../typechain";

/*
Script to upgrade (and test) zNS Registrar to v1.1

- Deploys a zNS Registrar Beacon (used by beacon proxies)
  - We need this because sub domain registrars will use the beacon
- Deploys the zNS Hub
- Upgrades the existing zNS Registrar

If you get a `Deployment at address 0xA677906024550c800fa881FDD638AaBd5a7E5b09 is not registered` error
then make sure to copy/paste `./.openzeppelin/mainnet.json` and rename it to `./.openzeppelin/unknown-31337.json`

*/

// Mainnet Registrar
const registrarAddress = "0xa4F6C921f914ff7972D7C55c15f015419326e0Ca";

const main = async () => {
  let deployer = (await hre.ethers.getSigners())[0];

  if ((await hre.ethers.provider.getNetwork()).chainId == 31337) {
    const mainnetDeployer = "0x7829Afa127494Ca8b4ceEF4fb81B78fEE9d0e471";

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

  // Upgrade the existing registrar
  console.log(`Upgrading existing zNS Registrar`);
  await hre.upgrades.upgradeProxy(
    registrarAddress,
    new Registrar__factory(deployer),
    {
      call: {
        fn: "upgradeFromNormalRegistrar",
        args: [hub.address],
      },
    }
  );
};

main().catch(console.error);
