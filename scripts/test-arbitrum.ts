import * as hre from "hardhat";
import { ethers } from "ethers";
import { BasicController, Registrar } from "../typechain";
import basicControllerJson from "../artifacts/contracts/BasicController.sol/BasicController.json";
import registrarJson from "../artifacts/contracts/Registrar.sol/Registrar.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const main = async () => {
  const registrarAbi = registrarJson.abi;
  const basicControllerAbi = basicControllerJson.abi;

  // Rinkeby addresses
  const rinkebyRegistrarAddress = "";

  // Arbitrum addresses
  const arbitrumRegistrarAddress = "0xdDd0516188a2240c864AAd7E95FF832038fa7804";
  const basicControllerAddress = "0x767f026bF6d2146d31889B3c4F9E489DBb88aadc";
  const stakingControllerAddress = "0x53EF64F91e0d2f4577807f39760d2D266011cd40";
  const signers = await hre.ethers.getSigners();

  const deployer: SignerWithAddress = signers[0];

  // Typing gives us intellisense
  const registrar = new hre.ethers.Contract(
    arbitrumRegistrarAddress,
    registrarAbi,
    deployer
  ) as Registrar;

  const basicController = new hre.ethers.Contract(
    basicControllerAddress,
    basicControllerAbi,
    deployer
  ) as BasicController;

  // Only have to call init once for each contract
  try {
    const isController = await registrar.controllers(basicControllerAddress);

    // test sending a message between L1 and L2 registrar?
    console.log(isController);
  } catch (e) {
    console.log(e);
  }
  // get root domain
  // const records = await registrar.records(ethers.BigNumber.from("0"));
  // console.log(records);

  // const tx = await basicController.registerSubdomainExtended(
  //   hre.ethers.BigNumber.from("0"),
  //   "another.label",
  //   await deployer.getAddress(),
  //   "ipfs://no-metadata",
  //   5,
  //   false
  // );
  // await tx.wait(3);
  // console.log(tx);
};

main();
