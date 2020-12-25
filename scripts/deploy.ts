import { ethers } from "hardhat";
import { Registrar__factory, Registrar } from "../typechain";
import { getAccounts } from "../src/utils";
import { Contract } from "ethers";
import r from "../artifacts/contracts/Registrar.sol/Registrar.json";

async function main() {
  // We get the contract to deploy
  const signers = await ethers.getSigners();
  const accs = await getAccounts(signers);
  const Registrar = (await ethers.getContractFactory(
    "Registrar"
  )) as Registrar__factory;
  let nonce = await ethers.provider.getTransactionCount(accs[0]);
  const registrar = await Registrar.deploy(accs[0], {
    nonce: nonce++,
  });
  console.log("Registrar deployed to ", registrar.address);
  await Promise.all([
    registrar.createDomain("foo", accs[0], accs[0], "someref0", {
      nonce: nonce++,
      gasLimit: '500000',
      gasPrice: '2000000000'
    }),
    registrar.createDomain("foo.bar", accs[0], accs[0], "someref1", {
      nonce: nonce++,
      gasLimit: '500000',
      gasPrice: '2000000000'
    }),
    registrar.createDomain("foo.baz", accs[0], accs[0], "someref2", {
      nonce: nonce++,
      gasLimit: '500000',
      gasPrice: '2000000000'
    }),
    registrar.createDomain("community", accs[0], accs[0], "someref3", {
      nonce: nonce++,
      gasLimit: '500000',
      gasPrice: '2000000000'
    }),
    registrar.createDomain("community.dao", accs[0], accs[0], "someref4", {
      nonce: nonce++,
      gasLimit: '500000',
      gasPrice: '2000000000'
    }),
    registrar.createDomain("community.token", accs[0], accs[0], "someref5", {
      nonce: nonce++,
      gasLimit: '500000',
      gasPrice: '2000000000'
    }),
    registrar.createDomain("community.token.trad", accs[0], accs[0], "someref6", {
      nonce: nonce++,
      gasLimit: '500000',
      gasPrice: '2000000000'
    }),
  ]);
  console.log("Deployment script finished");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
