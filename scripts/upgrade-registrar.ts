import { ethers, upgrades, run } from "hardhat";

async function main() {
  await run("compile");

  const proxy = "0xC613fCc3f81cC2888C5Cccc1620212420FFe4931";

  const factory = await ethers.getContractFactory("Registrar");
  console.log("upgrading");
  await upgrades.upgradeProxy(proxy, factory);
  console.log("upgraded");
}
main();
