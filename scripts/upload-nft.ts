import * as fs from "fs";
import { getLogger } from "../utilities";

const logger = getLogger("scripts::upload-nft");

const ipfsBaseUri = "https://ipfs.io/ipfs/";

const imagePath = "../wilderworld.png";
const nftName = "Wilder World";
const nftDescription = "Wilder World - Root";

interface NFTMetadata {
  image: string;
  description: string;
  name: string;
}

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const createClient = require("ipfs-http-client");
  const client = createClient("https://ipfs.infura.io:5001");

  const imageContent = fs.readFileSync(imagePath);
  logger.log(`uploading image`);
  const imageEntry = await client.add(imageContent);
  logger.log(`image cid: ${imageEntry.cid}`);

  const nftMetadata: NFTMetadata = {
    image: `${ipfsBaseUri}${imageEntry.cid}`,
    description: nftDescription,
    name: nftName,
  };

  logger.log(`uploading json`);
  const content = JSON.stringify(nftMetadata);
  const entry = await client.add(content);
  logger.log(`json cid: ${entry.cid}`);

  logger.log(`metadata uri: ${ipfsBaseUri}${entry.cid}`);
}

main();
