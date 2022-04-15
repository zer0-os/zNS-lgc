import * as fs from "fs";
import * as hre from "hardhat";
import { Registrar__factory } from "../../typechain";

const registrarAddress = "0xc2e9678A71e50E5AEd036e00e9c5caeb1aC5987D"; // default reg
const ipfsFolder = "ipfs://QmRYLEiSWMHLA6W7HfHZaLymTREd2q7UM1vHyo38nFmg1o/";

interface IdList {
  ids: string[];
}

const main = async () => {
  const signers = await hre.ethers.getSigners();
  const registrar = Registrar__factory.connect(registrarAddress, signers[0]);

  const wheels = fs.readFileSync("wrong-number-plates.json");
  const wheelsContents = JSON.parse(wheels.toString()) as IdList;

  const currentChunk = wheelsContents.ids;
  const tx = await registrar.adminSetMetadataBulk(ipfsFolder, currentChunk, 0);
  console.log(tx.hash);
  console.log("awaiting tx...");
  await tx.wait();
};

main().catch(console.error);
