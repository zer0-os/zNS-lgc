import { ethers } from "hardhat";

async function main() {
  const accounts = await ethers.getSigners();
  const signer = accounts[0];

  const nonce = await signer.getTransactionCount();
  console.log(`cancel nonce ${nonce}`);

  await signer.sendTransaction({
    to: signer.address,
    value: 0,
    nonce,
    gasPrice: 999000000000,
  });
}

main();
