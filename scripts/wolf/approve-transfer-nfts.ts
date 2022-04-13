import * as hre from "hardhat";
import { Registrar__factory } from "../../typechain";

const registrarAddress = "0x1A178CFD768F74b3308cbca9998C767F4E5B2CF8";

const operator = "0x63E34f60EA13b34681B76Dcb1614dD985dD8E11e"; // wolf sale contract

const main = async () => {
  const signers = await hre.ethers.getSigners();
  const registrar = Registrar__factory.connect(registrarAddress, signers[0]);
  const tx = await registrar.setApprovalForAll(operator, true);
  console.log(tx.hash);
};

main().catch(console.error);
