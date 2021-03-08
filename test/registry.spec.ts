import { Registry } from "../typechain/Registry";
import { Registry__factory } from "../typechain/factories/Registry__factory";
import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

describe("Registry", () => {
  let accounts: SignerWithAddress[];
  let registryFactory;
  let registry: Registry;

  before(async () => {
    accounts = await ethers.getSigners();
  });

  it("deploys", async () => {
    registryFactory = new Registry__factory(accounts[0]);
    registry = await registryFactory.deploy();
  });

  it("has owner", async () => {
    expect(await registry.owner()).to.eq(accounts[0].address);
  });
});
