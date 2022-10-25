import * as hre from "hardhat";
import { ethers } from "hardhat";
import { Registrar__factory, ZNSHub, ZNSHub__factory } from "../../typechain";

/**
 *
 * Subcontract Registrar Beacon *
 * ZNS Hub
 * Registrar (Root)
 * Set Default Registrar on ZNS Hub
 * Added Root Registrar to ZNS Hub
 */

const main = async () => {
  let deployer = (await hre.ethers.getSigners())[0];

  // Deploy the zNS Registrar Beacon
  console.log(`deploying beacon`);
  const beacon = await hre.upgrades.deployBeacon(
    new Registrar__factory(deployer)
  );
  console.log(`beacon deployed at ${beacon.address}`);

  // Deploy the zNS Hub
  const hub = await hre.upgrades.deployProxy(new ZNSHub__factory(deployer), [
    ethers.constants.AddressZero,
    beacon.address,
  ]);
  console.log(`Deployed hub to ${hub.address}`);

  const root = await hre.upgrades.deployProxy(
    new Registrar__factory(deployer),
    [
      ethers.constants.AddressZero,
      ethers.constants.HashZero,
      "Zer0 Name Service",
      "zNS",
      hub.address,
    ]
  );
  console.log(`Root deployed to ${root.address}`);

  await (hub as ZNSHub).connect(deployer).setDefaultRegistrar(root.address);
  await (hub as ZNSHub)
    .connect(deployer)
    .addRegistrar(ethers.constants.HashZero, root.address);
};

main().catch(console.error);
