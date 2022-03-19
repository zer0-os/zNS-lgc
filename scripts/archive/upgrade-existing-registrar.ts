import { ethers, upgrades } from "hardhat";
import { getLogger } from "../utilities";

// import * as hre from "hardhat";

async function main() {
  const registrar = "0xc2e9678A71e50E5AEd036e00e9c5caeb1aC5987D";

  await upgrades.upgradeProxy(
    registrar,
    await ethers.getContractFactory("Registrar"),
    {
      call: {
        fn: "upgradeFromNormalRegistrar",
        args: [ethers.constants.AddressZero, ethers.constants.AddressZero],
      },
    }
  );

  // await hre.network.provider.request({
  //   method: "hardhat_impersonateAccount",
  //   params: ["0x00181436F7dB266D4B5EA6bD6E97d726Af35fc6C"],
  // });

  // const signer = await ethers.getSigner(
  //   "0x00181436F7dB266D4B5EA6bD6E97d726Af35fc6C"
  // );

  // await hre.network.provider.send("hardhat_setBalance", [
  //   "0x00181436F7dB266D4B5EA6bD6E97d726Af35fc6C",
  //   "0xA688906BD8B00000",
  // ]);
}
main();
