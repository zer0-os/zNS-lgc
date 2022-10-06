import { ethers, upgrades, run } from "hardhat";
import * as hre from "hardhat"
import { MigrationRegistrar, ZNSHub__factory } from "../../../typechain";
import { runSimulation } from "./runSimulation";
import { getAddressesForNetwork } from "./addresses"

async function main() {

  const contracts = await runSimulation();

  const addresses = getAddressesForNetwork(hre.network.name);

  const tx = await contracts.registrar.setParentRegistrar(addresses.legacyRegistrar);

  if (hre.network.name !== "hardhat") {
    tx.wait(3);
  }

  const parentRegistrar = await contracts.registrar.parentRegistrar();
  console.log(parentRegistrar);
}

