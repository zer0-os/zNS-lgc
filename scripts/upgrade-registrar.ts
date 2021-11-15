import { ethers, upgrades, run } from "hardhat";

async function main() {
  await run("compile");

  const proxy = "0xc2e9678A71e50E5AEd036e00e9c5caeb1aC5987D";

  const factory = await ethers.getContractFactory("Registrar");
  console.log("upgrading");
  await upgrades.upgradeProxy(proxy, factory);
  console.log("upgraded");
}
main();
