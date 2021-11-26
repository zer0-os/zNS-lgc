import { ethers } from "hardhat";
import { RegistrarAdminClaim__factory } from "../typechain";

async function main() {
  const signers = await ethers.getSigners();
  const registrar = "0xc2e9678A71e50E5AEd036e00e9c5caeb1aC5987D";
  const domainId =
    "0x79e5bdb3f024a898df02a5472e6fc5373e6a3c5f65317f58223a579d518378df";
  const newOwner = "0x2A73C1438e9cB8BfC151d8cE2428E5639F42BBA5";

  const instance = RegistrarAdminClaim__factory.connect(registrar, signers[0]);
  const tx = await instance.adminTransfer(domainId, newOwner);
  console.log(tx.hash);
}
main();
