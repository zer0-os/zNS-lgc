import { ethers, upgrades } from "hardhat";

//const logger = getLogger("src::deploy-registrar");

async function main() {
  const accounts = await ethers.getSigners();
  const signer = accounts[0];

  // await network.provider.request({
  //   method: "hardhat_impersonateAccount",
  //   params: ["0x7829afa127494ca8b4ceef4fb81b78fee9d0e471"],
  // });

  // const signer = await ethers.getSigner(
  //   "0x37358aa5d051b434c23bad744e56e6a484107272"
  // );

  // await network.provider.send("hardhat_setBalance", [
  //   "0x37358aa5d051b434c23bad744e56e6a484107272",
  //   "0x56BC75E2D63100000",
  // ]);
  console.log(signer.address);

  const registrarFactory = await ethers.getContractFactory("Registrar", signer);

  const proxyAddress = "0xc2e9678A71e50E5AEd036e00e9c5caeb1aC5987D";

  await upgrades.upgradeProxy(proxyAddress, registrarFactory);
}

main();
