import * as hre from "hardhat";
import {
  BeaconProxy__factory,
  Registrar,
  Registrar__factory,
  ZNSHub__factory,
} from "../../typechain";

const registrarAddress = "0x1a178cfd768f74b3308cbca9998c767f4e5b2cf8"; // wilder.beasts.wolf reg?
const parentDomainId =
  "0xfdfffccca231538c87645cf3b8eb5169d6945d18e1aeb7e642ed6ee75bfbd2f3";

const deployerWallet = "0xadfe719d34736792956ce8dca8a325922812bbbe";
const minterWallet = "0xadfe719d34736792956ce8dca8a325922812bbbe"; //TODO: Verify

const ipfsFolder = "ipfs://QmNpqMLmyoX886F6AFxCD7wSGgPy4HSoiVwya2SjgM9NTL/";

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

  const instance: Registrar = Registrar__factory.connect(
    registrarAddress,
    deployer
  );

  console.log(`Registering bulk`);
  const startIndex = 0;
  const endIndex = 3332;
  const batchSize = 50;
  const namingOffset = 1;
  for (let i = startIndex; i < endIndex; i += batchSize) {
    const batchEnd = Math.min(i + batchSize, endIndex);
    const tx = await instance.registerDomainAndSendBulk(
      parentDomainId,
      namingOffset,
      i,
      batchEnd,
      minterWallet,
      ipfsFolder,
      0,
      true
    );

    console.log(tx);

    console.log(`tx hash: ${tx.hash}`);
    console.log(`Waiting to be confirmed...`);
    const res = await tx.wait();
    console.log(res);
    console.log(`finished`);
  }
};

main().catch(console.error);
