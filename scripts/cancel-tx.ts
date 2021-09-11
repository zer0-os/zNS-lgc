import { ethers } from "hardhat";

async function main() {
  const accounts = await ethers.getSigners();
  const signer = accounts[0];

  await signer.sendTransaction({
    to: signer.address,
    value: 0,
    nonce: 62,
    gasPrice: 100000000000,
  });
}

main();
