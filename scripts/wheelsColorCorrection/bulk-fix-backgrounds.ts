import * as hre from "hardhat";
import * as fs from "fs";
import { Registrar, Registrar__factory } from "../../typechain";

const registrarAddress = "0xc2e9678a71e50e5aed036e00e9c5caeb1ac5987d"; // mainnet

const deployerWallet = "0x7829Afa127494Ca8b4ceEF4fb81B78fEE9d0e471"; // cpt deployer 2

const ipfsFolder = "ipfs://QmXGFkhdjRyFvCBNDWL8N22uGGrCv8UfCSaWxtmeyiF5GV/"; // may-blue-studio

const blueStudioIDsFile = "Blue_Studio_IDs.json";

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

  const input = fs.readFileSync(blueStudioIDsFile);
  const newColoredIDs = JSON.parse(input.toString()) as idList;
  const batch = newColoredIDs.ids;
  const noOffset = 0;

  const instance: Registrar = Registrar__factory.connect(
    registrarAddress,
    deployer
  );

  // const testID =
  //   "0xdd12b4d10470389660ac2775473392100a018d04874d4a5b33c65a93ea2674f0";

  // const tx3 = await instance.tokenURI(testID);

  // console.log(tx3);

  const tx = await instance.adminSetMetadataBulk(ipfsFolder, batch, noOffset);

  console.log(`tx hash: ${tx.hash}`);
  console.log(`Waiting to be confirmed...`);
  const res = await tx.wait();
  console.log(`used ${res.gasUsed.toString()} gas`);

  // const tx2 = await instance.tokenURI(testID);
  // console.log(tx2);
};

main().catch(console.error);
