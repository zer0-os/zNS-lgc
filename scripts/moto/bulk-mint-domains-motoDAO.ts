import * as hre from "hardhat";
import { IRegistrar, IRegistrar__factory } from "../../typechain";

const registrarAddress = "0x51bd5948cf84a1041d2720f56ded5e173396fc95"; // wilder.moto.genesis reg
const parentDomainId =
  "0xf972951da6996be9d4fb0a5c7bcbc229c82eb1270af32f05a4fbc57b7d16e3b9"; // wilder.moto.genesis

const deployerWallet = "0xF5A37a4c139D639d04875f1945b59B1fA6cf939B"; // wilder moto deployer
const minterWallet = "0x624fb845A6b2C64ea10fF9EBe710f747853022B3"; // moto dao

const numberToMint = 1564 - 750;

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

  console.log(`Registering bulk`);
  const startIndex = 4980 + 50; // 18 will be minted for marketing, 4262 were minted by users
  const endIndex = startIndex + numberToMint;
  const batchSize = 50;
  const namingOffset = 0;
  const groupID = 1;
  for (let i = startIndex; i < endIndex; i += batchSize) {
    const batchEnd = Math.min(i + batchSize, endIndex);

    console.log(`Registering bulk, startIndex=${startIndex} i=${i}`);
    const tx = await instance.registerDomainInGroupBulk(
      parentDomainId,
      groupID,
      namingOffset, // folder /0 becomes /(0 + namingOffset)
      i, // start of folder /0
      batchEnd, // end of folder /30 (if amount is 30)
      minterWallet, // minter
      0, // royalty
      minterWallet // send to
    );

    console.log(`tx hash: ${tx.hash}`);
    console.log(`Waiting to be confirmed...`);
    const res = await tx.wait();
    console.log(`used ${res.gasUsed.toString()} gas`);
  }
};

main().catch(console.error);
