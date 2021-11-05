import { ethers, upgrades, run } from "hardhat";

async function main() {
  const signers = await ethers.getSigners();

  const proxy = "0xc2e9678A71e50E5AEd036e00e9c5caeb1aC5987D";

  const registrarFactory = await ethers.getContractFactory(
    "RegistrarMDFix",
    signers[0]
  );

  await upgrades.upgradeProxy(proxy, registrarFactory);
}
main();
