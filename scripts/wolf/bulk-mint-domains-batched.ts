import * as hre from "hardhat";
import { Registrar, Registrar__factory } from "../../typechain";

const registrarAddress = "0x1A178CFD768F74b3308cbca9998C767F4E5B2CF8"; // "0x1A178CFD768F74b3308cbca9998C767F4E5B2CF8"; // wilder.beasts.wolf reg
const parentDomainId =
  "0xfdfffccca231538c87645cf3b8eb5169d6945d18e1aeb7e642ed6ee75bfbd2f3";
// "0xfdfffccca231538c87645cf3b8eb5169d6945d18e1aeb7e642ed6ee75bfbd2f3"; wilder.beasts.wolf

const deployerWallet = "0xadFe719d34736792956cE8dCa8A325922812BBBE"; //"0xadFe719d34736792956cE8dCa8A325922812BBBE";
const minterWallet = "0xadFe719d34736792956cE8dCa8A325922812BBBE"; // "0xadFe719d34736792956cE8dCa8A325922812BBBE";

const ipfsFolder = "ipfs://QmfWuoR2Cxezerynjjknhmus1qgGdwLRcBLQVFSrdHAwnJ/";

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
  const startIndex = 1100;
  const endIndex = 3333;
  const batchSize = 50;
  const namingOffset = 1;
  for (let i = startIndex; i < endIndex; i += batchSize) {
    const batchEnd = Math.min(i + batchSize, endIndex);

    console.log(`Registering bulk, startIndex=${startIndex} i=${i}`);
    const tx = await instance.registerDomainAndSendBulk(
      parentDomainId,
      namingOffset, // folder /0 becomes /(0 + namingOffset)
      i, // start of folder /0
      batchEnd, // end of folder /30 (if amount is 30)
      minterWallet,
      ipfsFolder,
      0, // royalty
      true
    );

    console.log(`tx hash: ${tx.hash}`);
    console.log(`Waiting to be confirmed...`);
    const res = await tx.wait();
    console.log(`used ${res.gasUsed.toString()} gas`);
  }
};

main().catch(console.error);
