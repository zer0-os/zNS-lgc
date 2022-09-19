import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers, network, upgrades } from "hardhat";
import { ZNAResolver } from "../../typechain";
import { config } from "../shared/config";
import { verifyContract } from "../shared/helpers";

async function main() {
  const signers = await ethers.getSigners();
  if (signers.length < 1) {
    throw new Error(`Not found deployer`);
  }

  const deployer: SignerWithAddress = signers[0];

  if (
    network.name === "goerli" ||
    network.name === "rinkeby" ||
    network.name === "mainnet"
  ) {
    console.log("Deploying ZNAResolver proxy contract...");
    const ZNAResolverFactory = await ethers.getContractFactory("ZNAResolver");
    const zNAResolver = (await upgrades.deployProxy(
      ZNAResolverFactory,
      [config[network.name].zNSHub],
      {
        kind: "uups",
        initializer: "__ZNAResolver_init",
      }
    )) as ZNAResolver;
    await zNAResolver.deployed();
    console.log(`\ndeployed: ${zNAResolver.address}`);

    const zNAResolverImpl = await upgrades.erc1967.getImplementationAddress(
      zNAResolver.address
    );
    await verifyContract(zNAResolverImpl);

    console.table([
      {
        Label: "Deployer address",
        Info: deployer.address,
      },
      {
        Label: "ZNAResolver proxy address",
        Info: zNAResolver.address,
      },
      {
        Label: "ZNAResolver implementation address",
        Info: zNAResolverImpl,
      },
    ]);

    console.log("\n\nWelcome to ZNAResolver!");
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
