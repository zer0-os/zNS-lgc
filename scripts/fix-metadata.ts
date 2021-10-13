import { ethers } from "hardhat";
import { RegistrarWheelsFix__factory } from "../typechain";
import * as fs from "fs";

const registrarAddress = "0xc2e9678A71e50E5AEd036e00e9c5caeb1aC5987D";
const updateFilePath = "./domainsToUpdate_test.json";
const checkpointFilePath = "./domainUpdateCheckpoint.json";
const preCheckpointFilePath = "./pre-domainUpdateCheckpoint.json";
const chunkSize = 100; // domains to update at a time

interface DomainToUpdate {
  id: string;
  metadataUri: string;
}

interface UpdateFile {
  domains: DomainToUpdate[];
}

interface CheckpointFile {
  [domainId: string]: boolean | undefined;
}

const saveCheckpoint = (checkpoint: CheckpointFile, pre: boolean) => {
  const path = pre ? preCheckpointFilePath : checkpointFilePath;
  fs.writeFileSync(path, JSON.stringify(checkpoint));
};

const loadCheckpoint = () => {
  try {
    const checkpoint = JSON.parse(
      fs.readFileSync(checkpointFilePath).toString()
    ) as CheckpointFile;
    return checkpoint;
  } catch (e) {
    console.warn(`No checkpoint file?`);
    return {} as CheckpointFile;
  }
};

const loadUpdateFile = () => {
  const toUpdate = JSON.parse(fs.readFileSync(updateFilePath).toString());
  return {
    domains: toUpdate,
  } as UpdateFile;
};

const main = async () => {
  const signers = await ethers.getSigners();
  const deployer = signers[0];

  const instance = RegistrarWheelsFix__factory.connect(
    registrarAddress,
    deployer
  );

  const manifest = loadUpdateFile();
  const checkpoint = loadCheckpoint();
  const domainsToUpdate: DomainToUpdate[] = [];

  for (const domain of manifest.domains) {
    if (checkpoint[domain.id]) {
      console.log(`skipping ${domain.id}`);
      continue;
    }

    domainsToUpdate.push(domain);
  }

  console.log(`There are ${domainsToUpdate.length} domains to update`);

  const chunks: DomainToUpdate[][] = [];
  let temp: DomainToUpdate[] | undefined;
  let i, j;
  for (i = 0, j = domainsToUpdate.length; i < j; i += chunkSize) {
    temp = domainsToUpdate.slice(i, i + chunkSize);
    chunks.push(temp);
  }

  console.log(`There are ${chunks.length} chunks`);

  for (const { index, chunk } of chunks.map((chunk, index) => ({
    index,
    chunk,
  }))) {
    const nonce = await deployer.getTransactionCount();

    const domainIds: string[] = [];
    const metadataChunk1: Uint8Array[] = [];
    const metadataChunk2: Uint8Array[] = [];

    for (const domain of chunk) {
      domainIds.push(domain.id);
      const ipfsHash = domain.metadataUri.replace("ipfs://Qm", "");
      const uriAsBytes = ethers.utils.toUtf8Bytes(ipfsHash);
      metadataChunk1.push(uriAsBytes.slice(0, 12));
      metadataChunk2.push(uriAsBytes.slice(12, uriAsBytes.length));
    }

    console.log(`nonce is ${nonce}?`);

    console.log(`sending chunk ${index}...`);

    const tx = await instance.fixDomainMetadata(
      domainIds,
      metadataChunk1,
      metadataChunk2,
      {
        nonce,
      }
    );

    for (const domain of domainIds) {
      console.log(domain);
      checkpoint[domain] = true;
    }
    saveCheckpoint(checkpoint, true);

    console.log(`waiting for tx to confirm`);
    console.debug(`tx hash is: ${tx.hash}`);
    await tx.wait(4);

    console.log(`finished sending chunk`);

    saveCheckpoint(checkpoint, false);
  }
};

main();
