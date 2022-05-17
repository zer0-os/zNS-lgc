import * as hre from "hardhat";
import { ethers } from "hardhat";
import { DomainPurchaser__factory } from "../../typechain";
import { impersonateAccount } from "../../utilities";
import { getZNSAddressesByNetworkName } from "../addresses";

const main = async () => {
  let deployer = (await hre.ethers.getSigners())[0];

  const network = await hre.ethers.provider.getNetwork();
  const addresses = getZNSAddressesByNetworkName(network.name);

  if (network.chainId == 31337) {
    deployer = await impersonateAccount(addresses.deployer);
  }
  console.log(`Deploying from ${deployer.address}`);

  const paymentToken = addresses.zeroToken;
  const hub = addresses.hub;
  const platformWallet = addresses.deployer;
  const prices = {
    short: ethers.utils.parseEther("100"),
    medium: ethers.utils.parseEther("100"),
    long: ethers.utils.parseEther("100"),
  };
  // 1000 = 100%, 10 = 1%
  const platformFee = "50"; // 5%

  const factory = new DomainPurchaser__factory(deployer);

  const instance = await hre.upgrades.deployProxy(factory, [
    paymentToken,
    hub,
    platformWallet,
    prices,
    platformFee,
  ]);

  console.log(`deployed to ${instance.address}`);
  console.log(`tx hash: ${instance.deployTransaction.hash}`);
};

main().catch(console.error);
