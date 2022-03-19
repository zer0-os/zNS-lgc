import { ethers, upgrades } from "hardhat";
import { Registrar__factory } from "../typechain";

async function main() {
  const signers = await ethers.getSigners();
  await upgrades.deployBeacon(new Registrar__factory(signers[0]), {});
}

main().catch(console.error);
