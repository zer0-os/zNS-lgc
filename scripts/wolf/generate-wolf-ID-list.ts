import * as hre from "hardhat";
import { Registrar, Registrar__factory } from "../../typechain";
import * as fs from "fs";

const registrarAddress = "0x1A178CFD768F74b3308cbca9998C767F4E5B2CF8"; // "0x1A178CFD768F74b3308cbca9998C767F4E5B2CF8"; // wilder.beasts.wolf reg
//const registrarAddress = "0xf2f1c79E1b2Ed2B14f3bd577248f9780e50c9BEa"; // Rinkeby jellybeans

const main = async () => {
  let deployer = (await hre.ethers.getSigners())[0];

  const instance: Registrar = Registrar__factory.connect(
    registrarAddress,
    deployer
  );

  const startIndex = 0;
  const endIndex = 3333;
  const ids: string[] = [];
  for (let i = startIndex; i < endIndex; i += 1) {
    ids.push((await instance.tokenByIndex(i)).toString());
    console.log(`${i} - ${ids[i]}`);
  }
  fs.writeFileSync("wolfIds.json", JSON.stringify({ ids }, undefined, 2));
};

main().catch(console.error);
