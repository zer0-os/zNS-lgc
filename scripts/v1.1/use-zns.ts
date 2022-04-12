import * as hre from "hardhat";
import { Registrar__factory } from "../../typechain";

const address = "0x23682326C87D079F73bd88402efD341E07731aE8";

const main = async () => {
  const signers = await hre.ethers.getSigners();
  const registrar = Registrar__factory.connect(address, signers[0]);
  const tx = await registrar.registerSubdomainContract(
    "0x290422f1f79e710c65e3a72fe8dddc0691bb638c865f5061a5e639cf244ee5ed",
    "wolf",
    "0xadFe719d34736792956cE8dCa8A325922812BBBE",
    "ipfs://QmQfEPPMXe5FeqmRoPuQ1P88vJ9nCKGwhF7gFumTB5H25m",
    0,
    true,
    "0xadFe719d34736792956cE8dCa8A325922812BBBE"
  );
  console.log(tx.hash);
};

main().catch(console.error);
