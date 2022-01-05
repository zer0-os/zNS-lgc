import { assert, debug } from "console";
import * as ethers from "ethers";
import * as hardhat from "hardhat";
import * as fs from "fs";
import { getLogger } from "../utilities";
import {
  IBasicController,
  IBasicController__factory,
  OwnableController__factory,
} from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const logger = getLogger("scripts");

let nftMetadata: MetadataAndTag[] = [];

interface MetadataAndTag {
  metadataUri: string;
  tag: string;
}

interface MetadataAndOwner {
  metadataUri: string;
  address: string;
}

interface WheelTagToWallet {
  [wheelTag: string]: string;
}

interface WheelsChunk {
  result: {
    nfts: MetadataAndTag[];
  };
}

interface LabelledMetadataAndOwner {
  [label: string]: MetadataAndOwner;
}

const parentId =
  "0x68975dd5a9af8e36c74f770836840e20ba1a15ca1114837fd5c54eca9a4d3533"; // Wilder wheels genesis

// const kovanParentId =
//   "0xb6b4538f2b01c630059c6e8214a4d4adabc3dc471e7148a51a0fec07bd2c86c0"; //testcraft

const royaltyAmount = ethers.utils.parseEther("0");
const lockOnCreation = true;

//const kovanController = "0x2aaf8385e7285eceb464bdbc7d50cf5c1b7363de";
const godController = "0x361e74E8fa656a7D9c47307829480DC0Ee92D6b8";

const getControllerInstance = async () => {
  const accounts = await hardhat.ethers.getSigners();
  const deployer = accounts[0];
  const controllerInstance = OwnableController__factory.connect(
    godController,
    deployer
  );

  return controllerInstance;
};

const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks = [];

  let i, j;
  for (i = 0, j = array.length; i < j; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    chunks.push(chunk);
  }

  return chunks;
};

const executeDrop = async () => {
  const controller = await getControllerInstance();

  const accounts = await hardhat.ethers.getSigners();
  const deployer = accounts[0];
  logger.log(`Deploying to ${hardhat.network.name}`);
  logger.log(`Using ${deployer.address} as accessor account`);
  const labelledMetadataAndTags: LabelledMetadataAndOwner = JSON.parse(
    await fs.readFileSync("labelledMetadataAndTags.json").toString()
  ) as LabelledMetadataAndOwner;

  const labels: string[] = Object.keys(labelledMetadataAndTags);
  const metadataUris: string[] = [];
  const owners: string[] = [];

  const chunk_start = 9765;
  const chunk_size = 50;
  const items_in_chunk = 0;

  Object.values(labelledMetadataAndTags).forEach((value) => {
    owners.push(value.address);
    metadataUris.push(value.metadataUri);
  });

  const chunkedOwners = chunkArray(owners, chunk_size);

  const chunkedMetadataUris = chunkArray(metadataUris, chunk_size);

  for (let j = 0; j < chunkedOwners.length; j++) {
    console.log(
      `Iteration ${j} - starting at index ${chunk_start + j * chunk_size}`
    );
    const tx = await controller
      .connect(deployer)
      .estimateGas["mintDomainsBulk(uint256,uint256,string[],address[])"](
        parentId,
        chunk_start + j * chunk_size,
        chunkedMetadataUris[j],
        chunkedOwners[j]
      );
    console.log(tx.toString());
    // logger.debug(`tx hash is: ${tx.hash}`);
    // logger.log(`waiting for tx to confirm...`);
    // await tx.wait(2);
  }

  // try {
  //   const tx = await controller
  //     .connect(deployer)
  //     .registerSubdomainExtended(
  //       parentId,
  //       label,
  //       deployer.address,
  //       metadataUri,
  //       royaltyAmount,
  //       lockOnCreation
  //     );
  //   logger.debug(`tx hash is: ${tx.hash}`);
  //   logger.log(`waiting for tx to confirm...`);
  //   await tx.wait(2);
  // } catch (e) {
  //   logger.log(`failed during label: ${label} \nMetadataUri: ${metadataUri}`);
  //   logger.log(e);
  // }
};

const main = async () => {
  logger.log("running...");
  await executeDrop();
};

main();
