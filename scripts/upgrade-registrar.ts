import { ethers, upgrades, run } from "hardhat";

async function main() {
  await run("compile");

  const proxy = "0x1188dD1a0F42BA4a117EF1c09D884f5183D40B28";

  const factory = await ethers.getContractFactory("BasicController");
  console.log("upgrading");
  await upgrades.upgradeProxy(proxy, factory);
  console.log("upgraded");
}
main();
