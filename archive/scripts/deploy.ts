import { ethers } from "hardhat";
import { Registry__factory, Registry } from "../typechain";
import { getAccounts } from "../src/utils";
import { Contract } from "ethers";
import r from "../artifacts/contracts/Registry.sol/Registry.json";
import ipfsClient from "ipfs-http-client";
import { readFileSync, writeFileSync } from "fs";

const ipfs = ipfsClient({
  //host: "ipfs.infura.io",
  host: "localhost",
  port: 5002,
  //protocol: "https",
  //headers: {
  //  authorization: "Bearer " + process.env.INFURA_TOKEN,
  //},
});

async function main() {
  // We get the contract to deploy
  const signers = await ethers.getSigners();
  const accs = await getAccounts(signers);
  const Registry = (await ethers.getContractFactory(
    "Registry"
  )) as Registry__factory;
  let nonce = await ethers.provider.getTransactionCount(accs[0]);
  const zeroImageCid = await ipfs
    .add(readFileSync("./scripts/zero-logo.png"))
    .then((f) => f.cid.toV0());
  const imageUrl = "ipfs://" + zeroImageCid;
  const registry = await Registry.deploy(
    accs[0],
    accs[0],
    "ipfs://Qmresolver...",
    imageUrl,
    {
      nonce: nonce++,
    }
  );

  await registry.deployed();

  const deployed = { registry: registry.address };

  writeFileSync("./deployed/rinkeby.json", JSON.stringify(deployed, null, 2));

  console.log("Registry deployed to ", registry.address);
  await Promise.all([
    registry.createDomain(
      "foo",
      accs[0],
      accs[0],
      "ipfs://Qmresolver",
      imageUrl,
      {
        nonce: nonce++,
        gasLimit: "500000",
        gasPrice: "2000000000",
      }
    ),
    registry.createDomain(
      "foo.bar",
      accs[0],
      accs[0],
      "ipfs://Qmresolver",
      imageUrl,
      {
        nonce: nonce++,
        gasLimit: "500000",
        gasPrice: "2000000000",
      }
    ),
    registry.createDomain(
      "foo.baz",
      accs[0],
      accs[0],
      "ipfs://Qmresolver",
      imageUrl,
      {
        nonce: nonce++,
        gasLimit: "500000",
        gasPrice: "2000000000",
      }
    ),
    registry.createDomain(
      "community",
      accs[0],
      accs[0],
      "ipfs://Qmresolver",
      imageUrl,
      {
        nonce: nonce++,
        gasLimit: "500000",
        gasPrice: "2000000000",
      }
    ),
    registry.createDomain(
      "community.dao",
      accs[0],
      accs[0],
      "ipfs://Qmresolver",
      imageUrl,
      {
        nonce: nonce++,
        gasLimit: "500000",
        gasPrice: "2000000000",
      }
    ),
    registry.createDomain(
      "community.token",
      accs[0],
      accs[0],
      "ipfs://Qmresolver",
      imageUrl,
      {
        nonce: nonce++,
        gasLimit: "500000",
        gasPrice: "2000000000",
      }
    ),
    registry.createDomain(
      "community.token.trad",
      accs[0],
      accs[0],
      "ipfs://Qmresolver",
      imageUrl,
      {
        nonce: nonce++,
        gasLimit: "500000",
        gasPrice: "2000000000",
      }
    ),
  ]);
  console.log("Deployment script finished");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
