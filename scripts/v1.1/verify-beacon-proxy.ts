import * as hre from "hardhat";

const proxy = "0x73124d6436a30C998628D980C9c2643aa2021944";
const beacon = "0x366e9e375b772A6fe1141E5dC02A99da8EAfB1D7";

const main = async () => {
  await hre.run("verify:verify", {
    address: proxy,
    constructorArguments: [beacon, Buffer.from("")],
  });
};

main().catch(console.error);
