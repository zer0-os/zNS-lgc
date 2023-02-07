import * as hre from "hardhat";

import { Registrar__factory, ZNSHub, ZNSHub__factory } from "../../typechain";
import { getLogger } from "../../utilities";
import { ethers } from "hardhat";

const logger = getLogger("scripts::new-impl");

const main = async () => {
  const [deployer] = await hre.ethers.getSigners();

  logger.log(`Using deployer address ${deployer.address}`);

  const network = hre.network.name;
  if (network === "goerli") {
    // Deploy the zNS Registrar Beacon
    const beacon = await hre.upgrades.deployBeacon(
      new Registrar__factory(deployer)
    );
    await beacon.deployed();
    console.log(`Beacon deployed at ${beacon.address}`);

    const zNSHub = await hre.upgrades.deployProxy(
      new ZNSHub__factory(deployer),
      [ethers.constants.AddressZero, beacon.address]
    );
    await zNSHub.deployTransaction.wait(3);
    console.log(`zNSHub deployed at ${zNSHub.address}`);

    const registrar = await hre.upgrades.deployProxy(
      new Registrar__factory(deployer),
      [
        ethers.constants.AddressZero,
        ethers.constants.HashZero,
        "Zer0 Name Service",
        "zNS",
        zNSHub.address,
      ]
    );
    await registrar.deployTransaction.wait(3);
    console.log(`Registrar deployed at ${registrar.address}`);

    await (zNSHub as ZNSHub)
      .connect(deployer)
      .setDefaultRegistrar(registrar.address);
    await (zNSHub as ZNSHub)
      .connect(deployer)
      .addRegistrar(ethers.constants.HashZero, registrar.address);

    const proxyAdmin = await hre.upgrades.admin.getInstance();
    console.log(`ProxyAdmin deployed at ${proxyAdmin.address}`);

    logger.log("Congratulations! You can check!");
  }
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
