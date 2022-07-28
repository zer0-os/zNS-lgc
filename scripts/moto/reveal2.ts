import * as hre from "hardhat";
import { IRegistrar, IRegistrar__factory } from "../../typechain";

const registrarAddress = "0x51bd5948cf84a1041d2720f56ded5e173396fc95"; // wilder.moto.genesis reg

const deployerWallet = "0xF5A37a4c139D639d04875f1945b59B1fA6cf939B"; // wilder moto deployer

const main = async () => {
  let deployer = (await hre.ethers.getSigners())[0];

  if ((await hre.ethers.provider.getNetwork()).chainId == 31337) {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [deployerWallet],
    });

    deployer = await hre.ethers.getSigner(deployerWallet);

    await hre.network.provider.send("hardhat_setBalance", [
      deployerWallet,
      "0x56BC75E2D63100000", // some big number
    ]);
  }

  if (deployer.address != deployerWallet) {
    throw Error(
      `Deployer address is not the expected address! ${deployer.address} != ${deployerWallet}`
    );
  }

  const instance: IRegistrar = IRegistrar__factory.connect(
    registrarAddress,
    deployer
  );

  const tx = await instance.updateDomainGroup(
    "1",
    "ipfs://QmcyUoQdrwUUowBRMsChTPcSDxoBHemBPVzDn5ZZ1YLS3P/" // motoReveal2 on the IPFS node
  );

  console.log(`awaiting confirmation for tx hash: ${tx.hash}`);
  await tx.wait(2);
  console.log("Transaction completed.");
};

main().catch(console.error);
