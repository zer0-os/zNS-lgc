import { ethers, upgrades, network, run } from "hardhat";
import { getLogger } from "../utilities";

//const logger = getLogger("scripts::deploy-registrar");

async function main() {
  //const accounts = await ethers.getSigners();

  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: ["0x37358aa5d051b434c23bad744e56e6a484107272"],
  });

  const signer = await ethers.getSigner(
    "0x37358aa5d051b434c23bad744e56e6a484107272"
  );

  await network.provider.send("hardhat_setBalance", [
    "0x37358aa5d051b434c23bad744e56e6a484107272",
    "0x56BC75E2D63100000",
  ]);

  const registrarFactory = await ethers.getContractFactory("Registrar", signer);

  const res = await upgrades.prepareUpgrade(
    "0xc2e9678A71e50E5AEd036e00e9c5caeb1aC5987D",
    registrarFactory
  );

  console.log(res);
}

main();
