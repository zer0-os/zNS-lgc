import * as hre from "hardhat";

const proxy = "0xf2f1c79E1b2Ed2B14f3bd577248f9780e50c9BEa";
const beacon = "0x366e9e375b772a6fe1141e5dc02a99da8eafb1d7";

const main = async () => {
  await hre.run("verify:verify", {
    address: proxy,
    constructorArguments: [beacon, Buffer.from("")],
  });
};

main().catch(console.error);
