import * as hardhat from "hardhat";
import {
  BasicController,
  BasicController__factory,
  // Registrar,
  // Registrar__factory,
} from "../typechain";
import * as fs from "fs";

const basicControllerAddress = "0xa05Ae774Da859943B7B859cd2A6aD9F5f1651d6a";
// const registrarAddress = "0xc2e9678A71e50E5AEd036e00e9c5caeb1aC5987D";
const parentDomainId =
  "0x68975dd5a9af8e36c74f770836840e20ba1a15ca1114837fd5c54eca9a4d3533";

interface DomainsToMintDto {
  [label: string]: string;
}
const domainsToMintFilepath = "./domainsToMint.json";

const main = async () => {
  const signers = await hardhat.ethers.getSigners();
  const deployer = signers[0];

  const instance: BasicController = BasicController__factory.connect(
    basicControllerAddress,
    deployer
  );

  // const registrarInstance: Registrar = Registrar__factory.connect(
  //   registrarAddress,
  //   deployer
  // );

  const domainsToMint = JSON.parse(
    fs.readFileSync(domainsToMintFilepath).toString()
  ) as DomainsToMintDto;

  for (const [label, metadata] of Object.entries(domainsToMint)) {
    console.log(`minting .${label}`);

    try {
      const tx = await instance.registerSubdomainExtended(
        parentDomainId,
        label,
        deployer.address,
        metadata,
        0,
        true
      );

      console.log(`tx hash: ${tx.hash}`);
      console.log(`Waiting to be confirmed...`);
      await tx.wait(2);

      // const tx2 =
      //   registrarInstance["safeTransferFrom(address,address,uint256)"](
      //     deployer
      //   );
    } catch (e) {
      console.error(`Failed to mint .${label}: ${e}`);
    }
  }

  console.log(`finished`);
};

main();
