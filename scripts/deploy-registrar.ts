const { ethers, upgrades } = require("hardhat");

async function main() {
  // Deploying
  const v1 = await ethers.getContractFactory("Registrar");
  const instance = await upgrades.deployProxy(v1);
  await instance.deployed();

  // Upgrading
  const v2 = await ethers.getContractFactory("RegistrarV2");
  const upgraded = await upgrades.upgradeProxy(instance.address, v2);
}

main();
