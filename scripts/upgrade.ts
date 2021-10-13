import { ethers, upgrades, network, run } from "hardhat";
import { getLogger } from "../utilities";

const logger = getLogger("scripts::upgrade");

async function main() {
  await run("compile");

  const bcAddress = "0xc2e9678A71e50E5AEd036e00e9c5caeb1aC5987D";

  logger.log(`upgrading ${bcAddress}`);

  const bcFactory = await ethers.getContractFactory("Registrar");
  await upgrades.upgradeProxy(bcAddress, bcFactory);

  logger.log("finished!");
}
main();
