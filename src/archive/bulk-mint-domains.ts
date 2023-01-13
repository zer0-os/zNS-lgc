import * as hre from "hardhat";
import { Registrar, Registrar__factory } from "../typechain";

const registrarAddress = "0xa4F6C921f914ff7972D7C55c15f015419326e0Ca";
const parentDomainId =
  "0xd4b1753dd4b8e14dc6fb88382a7381146b23fad2737fba56174ef1665f00f575";

const deployerWallet = "0x7829Afa127494Ca8b4ceEF4fb81B78fEE9d0e471";
const minterWallet = "0x7829Afa127494Ca8b4ceEF4fb81B78fEE9d0e471";
const sendToWallet = "0x7829Afa127494Ca8b4ceEF4fb81B78fEE9d0e471";

const main = async () => {
  let deployer = (await hre.ethers.getSigners())[0];

  if ((await hre.ethers.provider.getNetwork()).chainId == 31337) {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [deployerWallet],
    });

    deployer = await hre.ethers.getSigner(deployerWallet);

    await hre.network.provider.send("hardhat_setBalance", [
      deployerWallet,
      "0x56BC75E2D63100000", // some big number
    ]);
  }

  if (deployer.address != deployerWallet) {
    throw Error(
      `Deployer address is not the expected address! ${deployer.address} != ${deployerWallet}`
    );
  }

  console.log(`Upgrading to ensure proper version`);
  await hre.upgrades.upgradeProxy(
    registrarAddress,
    new Registrar__factory(deployer)
  );

  const instance: Registrar = Registrar__factory.connect(
    registrarAddress,
    deployer
  );

  console.log(`Registering bulk`);
  //const options = { gasLimit: 30000000 };
  const tx = await instance.registerDomainAndSendBulk(
    parentDomainId,
    5517,
    10,
    40,
    minterWallet,
    sendToWallet,
    "ipfs://QmZfmi2Du3uykHu7XT7EuLh4f2oP6RLK8JvbCBB21vx4jS/",
    0,
    true
  );

  console.log(tx);

  console.log(`tx hash: ${tx.hash}`);
  // console.log(`Waiting to be confirmed...`);
  const res = await tx.wait();
  console.log(res);
  console.log(`finished`);
};

main().catch(console.error);
