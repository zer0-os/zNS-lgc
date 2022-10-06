import { ethers, upgrades, run } from "hardhat";
import * as hre from "hardhat"
import { MigrationRegistrar, ZNSHub__factory } from "../../../typechain";
import { runSimulation } from "./runSimulation";
import { ROOT_DOMAIN_ID } from "./constants";

async function main() {
  await run("compile");

  const contracts = await runSimulation()

  const tx = await contracts.registrar.setRootDomainId(ROOT_DOMAIN_ID);

  if (hre.network.name !== "hardhat") {
    tx.wait(3);
  }

  const parentRegistrar = await contracts.registrar.rootDomainId();
  console.log(parentRegistrar);
}
main();
