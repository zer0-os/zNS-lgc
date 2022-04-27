import * as hre from "hardhat";
import { Registrar__factory } from "../../typechain";

const address = "0xa4f6c921f914ff7972d7c55c15f015419326e0ca"; //rinkeby candy NFT

const main = async () => {
  const signers = await hre.ethers.getSigners();
  const registrar = Registrar__factory.connect(address, signers[0]);
  const tx = await registrar.registerSubdomainContract(
    "106946957151920660163773010495852180151668072036628684427671988999737819816565",
    "s2-test",
    signers[0].address,
    "ipfs://QmeZB47dFzBu4CNg6FqZCtX79Ezoop8429UXDQtpmqCRPc/1",
    0,
    true,
    "0x35888AD3f1C0b39244Bb54746B96Ee84A5d97a53"
  );
  console.log(tx.hash);
};

main().catch(console.error);
