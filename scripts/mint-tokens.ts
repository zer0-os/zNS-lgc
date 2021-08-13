import { ethers } from "hardhat";
import { MockToken__factory } from "../typechain";

async function main() {
  const accounts = await ethers.getSigners();
  const token = MockToken__factory.connect("0x50A0A3E9873D7e7d306299a75Dc05bd3Ab2d251F", accounts[0]);

  const accountsToMintFor = [
    "0x35888AD3f1C0b39244Bb54746B96Ee84A5d97a53",
    "0x01Bb0395E7EFA60dB0c445738Ea62d1b4Ba04E41",
    "0xB816e8F253955081EacCa399bf64F574aAe7A5B1",
    "0x0DDdA1dd73C063Af0A8D4Df0CDd2a6818685f9CE",
    "0x16E51C8E6A90B68A065423ACCbdbEDE1a9259f30",
    "0x13fc7bcCa25BC0bAB1c9cbEc2Ea2a254F4357f6E",
    "0x98Cc8D4Be6B9ED58cA70801541dDD5d2F5AEA73F",
    "0x9C7879689054685E31ee4097f74ac5091AD09De0",
    "0xbB6a3A7ea2bC5cf840016843FA01D799Be975320",
    "0x822D71E46806081FA348aAB60A7b824B91e57825",
    "0xc141e4dC9908341e4aC511155bEB3134D3ed3148",
  ];

  for (let i = 0; i < accountsToMintFor.length; ++i) {
    console.log(`minting for ${accountsToMintFor[i]}`)
    const tx = await token.mintAmountFor(accountsToMintFor[i], ethers.utils.parseEther("1000000"));
    await tx.wait();
  }
}
main();