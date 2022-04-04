import * as hre from "hardhat";
import { Registrar__factory } from "../../typechain";

const address = "0x73124d6436a30C998628D980C9c2643aa2021944";

const main = async () => {
  const signers = await hre.ethers.getSigners();
  const registrar = Registrar__factory.connect(address, signers[0]);
  const tx = await registrar.registerDomainAndSend(
    "0x804272242ccaa9b022763d219b2679d0d1067fe5735a0ba9de2a2537afed08d6",
    "sub3",
    signers[0].address,
    "ipfs://QmWdqc8LPzpSTL5jnVhJDUvUAprn425vp4gtKhsaknxShu",
    0,
    true,
    "0x35888AD3f1C0b39244Bb54746B96Ee84A5d97a53"
  );
  console.log(tx.hash);
};

main().catch(console.error);
