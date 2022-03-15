import { ethers, upgrades } from "hardhat";
import { getLogger } from "../utilities";

// import * as hre from "hardhat";

const logger = getLogger("scripts::upgrade");

async function main() {
  //await run("compile");

  // const wheelsBasicController = "0x930E6b2AAd267A7Fa7e6C6dFcf0c70885B03C443";
  // const basicController = "0xa05Ae774Da859943B7B859cd2A6aD9F5f1651d6a";
  // const stakingController = "0x45b13d8e6579d5C3FeC14bB9998A3640CD4F008D";
  const registrar = "0xa4F6C921f914ff7972D7C55c15f015419326e0Ca";

  // console.log("upgrade bc1");
  // await upgrades.upgradeProxy(
  //   basicController,
  //   await ethers.getContractFactory("BasicController")
  // );

  console.log("upgrade reg");
  await upgrades.upgradeProxy(
    registrar,
    await ethers.getContractFactory("Registrar")
  );

  // console.log("upgrade wheels bc");
  // await upgrades.upgradeProxy(
  //   wheelsBasicController,
  //   await ethers.getContractFactory("BasicController")
  // );

  // console.log("upgrade sc");
  // await upgrades.upgradeProxy(
  //   stakingController,
  //   await ethers.getContractFactory("StakingController")
  // );

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

  // const sale = await ethers.getContractFactory("WhitelistSimpleSale");

  // const instance = sale
  //   .attach("0x19a55608f360f6Df69B7932dC2F65EDEFAa88Dc2")
  //   .connect(signer);

  // const tx = await instance.purchaseDomainsWhitelisted(
  //   1,
  //   0,
  //   [
  //     "0x8da8a19ecb053e7e17a6b6f5da2769d30fe9a0f56e0560e1f7ae8db05eeabf3e",
  //     "0xe0205120f15a22e3ff93e1c30a19dd7baae835696c7d8db90f487c668753cb1f",
  //     "0xb7f7cbd1b2f8060199f073e2d87b975e9ddbad4f42d4c42c01920d02f65470f8",
  //     "0x6927bdbde899ecb1d8c29f23a008b470ce6734382ded117b7e4595382e31918f",
  //     "0xf78ee29dc81fe57e6c4ce4b77c72edc0517a3561471e173c1d3e22d5ccd07510",
  //     "0x7108910b86287167a5c717d63bb841bde1b4bb675eed89d95f24e35362939bf0",
  //     "0x0e9b0783cd8c6efcdc8ac453dbcbb38c71413ac0b726e88973986443ee5e53fa",
  //     "0x1dfe9c586fb5138995f8bac8bad0014a4e21210a1eab5aa1efaefaf9467b347d",
  //     "0x771b3624643685d2d7e2162b3466fdd78dc7296fecf0e079548b30c298fa0a12",
  //     "0x2c046f51d8245eff4765ffd598f558a4822dee3964d7698a988469ca15979759",
  //     "0xaf032d1523e099c43ffbccf0157b0b8093f438b965bbf4e7f84f6ffaef95ae9d",
  //     "0x6eab588cc71434eb082c3b6d4126ae70e043516cafbadb606810680e6fd117df",
  //     "0x131d5030128b58c176a29f907cf06fa82cce362598e77f8a5188194a10ad6f3e",
  //   ],
  //   {
  //     value: ethers.utils.parseEther("0.369"),
  //   }
  // );

  logger.log("finished!");
}
main();
