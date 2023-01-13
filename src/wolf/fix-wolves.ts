import * as fs from "fs";
import * as hre from "hardhat";
import { Registrar__factory } from "../../typechain";

const registrarAddress = "0x1A178CFD768F74b3308cbca9998C767F4E5B2CF8";
const ipfsFolder = "ipfs://QmfWuoR2Cxezerynjjknhmus1qgGdwLRcBLQVFSrdHAwnJ/";

interface WolfList {
  ids: string[];
}

const main = async () => {
  const signers = await hre.ethers.getSigners();
  const registrar = Registrar__factory.connect(registrarAddress, signers[0]);

  const wolves = fs.readFileSync("first-900-wolves.json");
  const wolfContents = JSON.parse(wolves.toString()) as WolfList;
  const chunkSize = 150;
  const start = 300;
  for (let i = start; i < 900; i += chunkSize) {
    console.log(`iteration ${i}; ${i}-${i + chunkSize}`);
    const currentChunk = wolfContents.ids.slice(i, i + chunkSize);
    console.log(`offset=${i}`);
    console.log(`----------------`);
    const tx = await registrar.adminSetMetadataBulk(
      ipfsFolder,
      currentChunk,
      i
    );
    console.log(tx.hash);
    console.log("awaiting tx...");
    await tx.wait();
  }
};

main().catch(console.error);
