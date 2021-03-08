import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { deployMockContract } from "ethereum-waffle";
import { ethers } from "hardhat";
import { Registrar, Registrar__factory, Registry } from "../typechain";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { smockit } from "@eth-optimism/smock";

import IRegistry from "../artifacts/contracts/interfaces/IRegistry.sol/IRegistry.json";

chai.use(solidity);
const { expect } = chai;

describe("Registrar", () => {
  let accounts: SignerWithAddress[];
  let registryFactory: Registrar__factory;
  let registry: Registrar;
  let creatorAccountIndex: number = 0;
  let creator: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  before(async () => {
    accounts = await ethers.getSigners();
    creator = accounts[creatorAccountIndex];
    user1 = accounts[1];
    user2 = accounts[2];
  });

  beforeEach("deploys", async () => {
    let mock = await deployMockContract(creator, IRegistry.abi);
    const mockContract = await smockit(ethers.getContractFactory("IRegistry"));

    registryFactory = new Registrar__factory(creator);
    registry = await registryFactory.deploy(mock.address);
  });
});
