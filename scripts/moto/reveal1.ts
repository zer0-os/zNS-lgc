import * as hre from "hardhat";
import { IRegistrar, IRegistrar__factory } from "../../typechain";

const registrarAddress = "0x51bd5948cf84a1041d2720f56ded5e173396fc95"; // wilder.moto.genesis reg
const parentDomainId =
  "0xf972951da6996be9d4fb0a5c7bcbc229c82eb1270af32f05a4fbc57b7d16e3b9"; // wilder.moto.genesis

const deployerWallet = "0xF5A37a4c139D639d04875f1945b59B1fA6cf939B"; // wilder moto deployer
const minterWallet = "0xEe7Ad892Fdf8d95223d7E94E4fF42E9d0cfeCAFA"; // wheels dao

const numberToMint = 352;

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
    "ipfs://QmPDZv6qwspXSKtx5JHV4xbrEnqnuDXHQM3GvBFTFpdxaV/" // motoReveal1 on the IPFS node
  );

  console.log(`awaiting confirmation for tx hash: ${tx.hash}`);
  await tx.wait(2);
  console.log("Transaction completed.");
};

main().catch(console.error);
