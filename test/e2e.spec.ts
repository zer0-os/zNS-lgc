import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers, upgrades } from "hardhat";

import chai from "chai";
import { solidity } from "ethereum-waffle";
import { BigNumber } from "ethers";

chai.use(solidity);
const { expect } = chai;

describe("End 2 End Tests", () => {
  let accounts: SignerWithAddress[];
});
