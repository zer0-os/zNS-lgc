import { writeFileSync } from "fs";
import { getLogger } from "../utilities";

const logger = getLogger("src::upload-nft-json");

const ipfsBaseUri = "https://ipfs.io/ipfs/";

const images = [
  "QmeSpCtuQ3dgDz32K5EpEbKxesVwhSV5eABBQSWVuXn7u5",
  "QmYQWeAqhbErR5FrA9rCdYr58CJAqxPfxaDh4uhzvZtFEa",
  "Qmco1nYAxuk5pcDHfxADUB8nM3kNZafBsWD91rsuiNa5aS",
  "QmQdFi1waMeVtpgJRCgbdrMz7R447YnXHu93MRjdCAZ3hQ",
  "QmTXRQG4xUZ3mHy1GqxHFekNfRNuHg2UeVrBQu5CnoTsKT",
  "QmYFmdre8XbFBENDi6ZLCQHNNoaHKPk3M3DCnRzNn3HvuA",
];

const titles = [
  "Kylo Ren",
  "Pizza Boys",
  "Swear on this bible",
  "Master Plan",
  "Car sales man",
  "Jojo",
];

const descriptions = [
  "he is a mad sad boy",
  "they be shook",
  "i swear",
  "always works",
  "run",
  "oh no",
];

interface NFTMetadata {
  image: string;
  description: string;
  name: string;
}

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const createClient = require("ipfs-http-client");
  const client = createClient("https://ipfs.infura.io:5001");
  const nftMetadata: NFTMetadata[] = [];

  for (let i = 0; i < images.length; ++i) {
    nftMetadata.push({
      image: `${ipfsBaseUri}${images[i]}`,
      description: descriptions[i],
      name: titles[i],
    });
  }

  // upload to ipfs
  const nftMetadataUris: string[] = [];
  for (let i = 0; i < nftMetadata.length; ++i) {
    const content = JSON.stringify(nftMetadata[i]);
    const entry = await client.add(content);
    logger.log(`uploaded ${i} to ${entry.cid}`);
    nftMetadataUris.push(`${ipfsBaseUri}${entry.cid}`);
  }

  writeFileSync(
    `sample_metadata.json`,
    JSON.stringify({ uris: nftMetadataUris }, undefined, 2)
  );
}

main();
