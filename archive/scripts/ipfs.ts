require("dotenv").config();
import ipfsClient from "ipfs-http-client";
import { readFileSync } from "fs";

const ipfs = ipfsClient({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
  headers: {
    authorization: "Bearer " + process.env.INFURA_TOKEN,
  },
});

async function main() {
  const f = await ipfs.add(readFileSync("./scripts/zero-logo.png"));

  console.log(f.cid.toV0());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
