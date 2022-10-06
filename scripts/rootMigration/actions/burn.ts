import { ethers, upgrades, run } from "hardhat";
import * as hre from "hardhat"
import { MigrationRegistrar, ZNSHub__factory } from "../../../typechain";

export const burnToken = async (tokenId: string) => {


  // await registrar.connect(deployer).initialize(
  //   ethers.constants.AddressZero,
  //   ethers.constants.Zero,
  //   "Zer0 Name Service",
  //   "ZNS",
  //   ethers.constants.AddressZero
  // )

  // const contractOwner = await registrar.rootDomainId();

  // console.log(contractOwner)
}
