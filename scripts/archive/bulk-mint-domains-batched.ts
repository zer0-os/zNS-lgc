import * as hre from "hardhat";
import { Registrar, Registrar__factory } from "../typechain";

const registrarAddress = "0xc2e9678A71e50E5AEd036e00e9c5caeb1aC5987D";
const parentDomainId =
  "0x68975dd5a9af8e36c74f770836840e20ba1a15ca1114837fd5c54eca9a4d3533";

const deployerWallet = "0x7829Afa127494Ca8b4ceEF4fb81B78fEE9d0e471";
const minterWallet = "0xEe7Ad892Fdf8d95223d7E94E4fF42E9d0cfeCAFA";
const sendToWallet = "0xEe7Ad892Fdf8d95223d7E94E4fF42E9d0cfeCAFA";

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
  const startIndex = 0;
  const endIndex = 547;
  const batchSize = 25;
  for (let i = startIndex; i < endIndex; i += batchSize) {
    const batchEnd = Math.min(i + batchSize, endIndex);
    const tx = await instance.registerDomainAndSendBulk(
      parentDomainId,
      5517,
      i,
      batchEnd,
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
  }
};

main().catch(console.error);
