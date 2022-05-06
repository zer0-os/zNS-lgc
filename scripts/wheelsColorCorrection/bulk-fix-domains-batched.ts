import * as hre from "hardhat";
import * as fs from "fs";
import { Registrar, Registrar__factory } from "../../typechain";

const registrarAddress = "0xc2e9678a71e50e5aed036e00e9c5caeb1ac5987d"; // "0x1A178CFD768F74b3308cbca9998C767F4E5B2CF8"; // wilder.beasts.wolf reg
//const registrarAddress = "0xf2f1c79E1b2Ed2B14f3bd577248f9780e50c9BEa"; // Rinkeby jellybeans

const deployerWallet = "0x7829Afa127494Ca8b4ceEF4fb81B78fEE9d0e471"; //for mainnet
//const deployerWallet = "0x35888AD3f1C0b39244Bb54746B96Ee84A5d97a53"; //rinkeby

const ipfsFolder = "ipfs://QmbBVaB2zcJnzqbz6VUipbCk9YPiTZFZ9b28EhxHUox5z7/"; //mainnet
//const ipfsFolder = "ipfs://QmagskkYR1cJjAd2PU7pq68niTY3rhjYQefT1DfGDo6JLL/"; //rinkeby

const newColoredIDsFile = "newColoredIDs.json";

interface idList {
  ids: string[];
}

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

  const input = fs.readFileSync(newColoredIDsFile);
  const newColoredIDs = JSON.parse(input.toString()) as idList;

  const instance: Registrar = Registrar__factory.connect(
    registrarAddress,
    deployer
  );

  console.log(`Updating bulk`);
  const startIndex = 0;
  const endIndex = 1496;
  const batchSize = 100;
  for (let i = startIndex; i < endIndex; i += batchSize) {
    const trimmedBatchSize = Math.min(batchSize, endIndex - i);
    const batch = newColoredIDs.ids.slice(i, i + trimmedBatchSize);

    // console.log(
    //   `Updating bulk, startIndex=${startIndex} i=${i} trimmedBatchSize=${trimmedBatchSize}, batchLength=${batch.length}`
    // );
    // console.log(batch);

    const tx = await instance.estimateGas.adminSetMetadataBulk(
      ipfsFolder,
      batch,
      i
    );

    // console.log(`tx hash: ${tx.hash}`);
    // console.log(`Waiting to be confirmed...`);
    // const res = await tx.wait();
    // console.log(`used ${res.gasUsed.toString()} gas`);
  }
};

main().catch(console.error);
