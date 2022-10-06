import { ethers, upgrades, run } from "hardhat";
import * as hre from "hardhat"
import { MigrationRegistrar, ZNSHub__factory } from "../../../typechain";
import { runSimulation } from "./runSimulation";
import { DEPLOYER_ADDRESS } from "./constants";
import { ContractTransaction } from "ethers";

async function main() {
  await run("compile");

  const contracts = await runSimulation();

  const tx: ContractTransaction = await contracts.legacyRegistrar.mintDomain(
    ethers.constants.AddressZero,
    "0://tester",
    DEPLOYER_ADDRESS,
    "ipfs.io/ipfs/Qm",
    0,
    false,
    DEPLOYER_ADDRESS,
    REGISTRAR_BEACON
  );

  if (hre.network.name !== "hardhat") {
    tx.wait(3);
  }
  const domainId_1 = tx.value;
  const domainRecord = await contracts.registrar.records(domainId_1);
  console.log(domainRecord);
}

