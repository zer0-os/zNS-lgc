import * as hre from "hardhat";
import { Registrar__factory } from "../../typechain";
import * as fs from "fs";

const registrarAddress = "0x1A178CFD768F74b3308cbca9998C767F4E5B2CF8";
const wolfSeller = "0xadfe719d34736792956ce8dca8a325922812bbbe";
const marketingWallet = "0x053387FE5c3d990510C0069842c4C77069aDBc55";
const DAOWallet = "0x766A9b866930D0C7f673EB8Fc9655D5f782b2B21";

interface IDList {
  ids: string[];
}

const main = async () => {
  const signers = await hre.ethers.getSigners();
  const registrar = Registrar__factory.connect(registrarAddress, signers[0]);
  const marketingNFTs: IDList = JSON.parse(
    fs.readFileSync("wolfLeftovers/newMarketingDomains.json").toString()
  ) as IDList;
  console.log("marketing NFTs: " + marketingNFTs.ids.length);

  const DAONFTs: IDList = JSON.parse(
    fs.readFileSync("wolfLeftovers/daoWalletDomains.json").toString()
  ) as IDList;
  console.log("DAO NFTs: " + DAONFTs.ids.length);

  const tx = await registrar.transferFromBulk(
    wolfSeller,
    marketingWallet,
    marketingNFTs.ids
  );
  console.log(tx.hash);
  tx.wait();

  const tx2 = await registrar.transferFromBulk(
    wolfSeller,
    DAOWallet,
    DAONFTs.ids
  );
  console.log(tx2.hash);
  tx.wait();

  console.log("All done!");
};

main().catch(console.error);
