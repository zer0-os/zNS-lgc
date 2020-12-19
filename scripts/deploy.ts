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
  const id0 = await registrar.getId(["foo"]);
  const id3 = await registrar.getId(["community"]);

  console.log("Registrar deployed to ", registrar.address);
  await Promise.all([
    registrar.createRegistry(0, "foo", accs[0], accs[0], "someref0", {
      nonce: nonce++,
      gasLimit: '500000',
      gasPrice: '2000000000'
    }),
    registrar.createRegistry(id0, "bar", accs[0], accs[0], "someref1", {
      nonce: nonce++,
      gasLimit: '500000',
      gasPrice: '2000000000'
    }),
    registrar.createRegistry(id0, "baz", accs[0], accs[0], "someref2", {
      nonce: nonce++,
      gasLimit: '500000',
      gasPrice: '2000000000'
    }),
    registrar.createRegistry(0, "community", accs[0], accs[0], "someref3", {
      nonce: nonce++,
      gasLimit: '500000',
      gasPrice: '2000000000'
    }),
    registrar.createRegistry(id3, "dao", accs[0], accs[0], "someref4", {
      nonce: nonce++,
      gasLimit: '500000',
      gasPrice: '2000000000'
    }),
    registrar.createRegistry(id3, "token", accs[0], accs[0], "someref4", {
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
