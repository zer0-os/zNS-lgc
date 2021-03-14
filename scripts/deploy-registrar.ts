import { ethers, upgrades } from "hardhat";

async function main() {
  // Deploying
  const v1 = await ethers.getContractFactory("Registrar");
  const instance = await upgrades.deployProxy(v1, [], {
    initializer: "initialize",
  });
  await instance.deployed();
  console.log(instance.address);

  // Upgrading
  const v2 = await ethers.getContractFactory("RegistrarV2");
  const upgraded = await upgrades.upgradeProxy(instance.address, v2);
  console.log(upgraded.address);
}

main();
