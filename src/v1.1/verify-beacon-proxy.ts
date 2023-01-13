import * as hre from "hardhat";

const proxy = "0x23682326C87D079F73bd88402efD341E07731aE8";
const beacon = "0x4CD06F23e9Cc5658acCa6D5d681511f3d5616bc9";

const main = async () => {
  await hre.run("verify:verify", {
    address: proxy,
    constructorArguments: [beacon, Buffer.from("")],
  });
};

main().catch(console.error);
