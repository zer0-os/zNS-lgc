import * as hre from "hardhat";
import {
  BeaconProxy__factory,
  Registrar,
  Registrar__factory,
  ZNSHub__factory,
} from "../../typechain";

const hubAddress = "0x90098737eB7C3e73854daF1Da20dFf90d521929a";
const registrarAddress = "0xf2f1c79E1b2Ed2B14f3bd577248f9780e50c9BEa";
const parentDomainId =
  "0x73215dea134a9becfe394e33fbd2fe01bfa00017b9bcf2048a87b2fb867b3a9b";

const deployerWallet = "0x35888AD3f1C0b39244Bb54746B96Ee84A5d97a53";
const minterWallet = "0x35888AD3f1C0b39244Bb54746B96Ee84A5d97a53";
const sendToWallet = "0x35888AD3f1C0b39244Bb54746B96Ee84A5d97a53";

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

  const instance: Registrar = Registrar__factory.connect(
    registrarAddress,
    deployer
  );

  console.log(`Registering bulk`);
  const startIndex = 0;
  const endIndex = 547;
  const batchSize = 20;
  for (let i = startIndex; i < endIndex; i += batchSize) {
    const batchEnd = Math.min(i + batchSize, endIndex);
    const tx = await instance.registerDomainAndSendBulk(
      parentDomainId,
      5517,
      i,
      batchEnd,
      minterWallet,
      "ipfs://QmeZB47dFzBu4CNg6FqZCtX79Ezoop8429UXDQtpmqCRPc/",
      0,
      true
    );

    console.log(tx);

    console.log(`tx hash: ${tx.hash}`);
    console.log(`Waiting to be confirmed...`);
    const res = await tx.wait();
    console.log(res);
    console.log(`finished`);
  }
};

main().catch(console.error);
