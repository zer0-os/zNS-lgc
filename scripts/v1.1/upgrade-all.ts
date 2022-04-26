import * as hre from "hardhat";
import { Registrar__factory, ZNSHub__factory } from "../../typechain";

// mainnet
// const registrarAddress = "0xc2e9678A71e50E5AEd036e00e9c5caeb1aC5987D";
// const hubAddress = "0x3F0d0a0051D1E600B3f6B35a07ae7A64eD1A10Ca";
// const deployerAddress = "0x7829Afa127494Ca8b4ceEF4fb81B78fEE9d0e471";

// rinkeby
const registrarAddress = "0xa4F6C921f914ff7972D7C55c15f015419326e0Ca";
const hubAddress = "0x90098737eB7C3e73854daF1Da20dFf90d521929a";
const deployerAddress = "0x35888AD3f1C0b39244Bb54746B96Ee84A5d97a53";

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
  await hre.upgrades.upgradeProxy(
    hubAddress,
    new ZNSHub__factory(deployer),
    {}
  );
  console.log(`finished....`);

  console.log(`Upgrading root zNS Registrar`);
  const tx = await hre.upgrades.upgradeProxy(
    registrarAddress,
    new Registrar__factory(deployer),
    {}
  );
  console.log(`finished....`);

  console.log(`Upgrading zNS Sub-Registrar Beacon`);
  await hre.upgrades.upgradeBeacon(
    beaconAddress,
    new Registrar__factory(deployer),
    {
      timeout: 0,
    }
  );
  console.log(`finished....`);

  console.log("waiting for confirmations");
  await tx.deployTransaction.wait(3);

  console.log(`verifying implementation on etherscan`);
  const implementationAddress =
    await hre.upgrades.erc1967.getImplementationAddress(registrarAddress);
  await hre.run("verify:verify", { address: implementationAddress });
};

main().catch(console.error);
