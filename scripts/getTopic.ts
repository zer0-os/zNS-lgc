import { Registrar, Registrar__factory } from "../typechain";

import hre, { upgrades, run } from "hardhat";
import { ethers } from "ethers";

async function main() {
  const signers = await hre.ethers.getSigners();

  const factory = new Registrar__factory();

  const proxy = "0xc2e9678A71e50E5AEd036e00e9c5caeb1aC5987D";

  const registrar = factory.attach(proxy);

  console.log(registrar.filters.DomainCreated());

  registrar.interface.events[
    "DomainCreated(uint256,string,uint256,uint256,address,address,string,uint256)"
  ];
}
main().catch(console.log);
