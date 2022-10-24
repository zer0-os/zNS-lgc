import * as hre from "hardhat";
import { Registrar__factory, ZNSHub__factory } from "../../typechain";

// goerli
const registrarAddress = "0x009A11617dF427319210e842D6B202f3831e0116";
const hubAddress = "0xce1fE2DA169C313Eb00a2bad25103D2B9617b5e1";
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
  let tx = await hre.upgrades.upgradeProxy(
    hubAddress,
    new ZNSHub__factory(deployer),
    {}
  );
  console.log(`waiting for confirmations....`);
  await tx.deployTransaction.wait(2);
  console.log(`finished....`);

  console.log(`Upgrading root zNS Registrar`);
  tx = await hre.upgrades.upgradeProxy(
    registrarAddress,
    new Registrar__factory(deployer),
    {}
  );
  console.log(`waiting for confirmations....`);
  await tx.deployTransaction.wait(2);
  console.log(`finished....`);

  console.log(`Upgrading zNS Sub-Registrar Beacon`);
  tx = await hre.upgrades.upgradeBeacon(
    beaconAddress,
    new Registrar__factory(deployer),
    {
      timeout: 0,
    }
  );
  console.log(`waiting for confirmations....`);
  await tx.deployTransaction.wait(2);
  console.log(`finished....`);

  console.log(`verifying implementation on etherscan`);
  const implementationAddress =
    await hre.upgrades.erc1967.getImplementationAddress(hubAddress);
  await hre.run("verify:verify", { address: implementationAddress });

  await hre.run("verify:verify", { address: implementationAddress });
};

main().catch(console.error);
