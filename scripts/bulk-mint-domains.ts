import * as hardhat from "hardhat";
import { Registrar, Registrar__factory } from "../typechain";

const registrarAddress = "0xa4F6C921f914ff7972D7C55c15f015419326e0Ca";
const parentDomainId =
  "0xd4b1753dd4b8e14dc6fb88382a7381146b23fad2737fba56174ef1665f00f575";

const deployerWallet = "0x7829Afa127494Ca8b4ceEF4fb81B78fEE9d0e471";

const main = async () => {
  const signers = await hardhat.ethers.getSigners();
  const deployer = signers[0];

  const instance: Registrar = Registrar__factory.connect(
    registrarAddress,
    deployer
  );

  const options = { gasLimit: 1000000000000000 };

  try {
    const tx = await instance.estimateGas.registerDomainAndSendBulk(
      parentDomainId,
      5517,
      0,
      1,
      deployerWallet,
      deployerWallet,
      "ipfs://QmZfmi2Du3uykHu7XT7EuLh4f2oP6RLK8JvbCBB21vx4jS/",
      0,
      true,
      options
    );

    console.log(tx);

    // console.log(`tx hash: ${tx.hash}`);
    // console.log(`Waiting to be confirmed...`);
    // await tx.wait(2);
  } catch (e) {
    console.error(`Failed to mint: ${e}`);
  }
  console.log(`finished`);
};

main();
