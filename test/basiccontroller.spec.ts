import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers, upgrades } from "hardhat";
import chai from "chai";
import { deployMockContract, MockContract, solidity } from "ethereum-waffle";

import * as registrar from "../artifacts/contracts/Registrar.sol/Registrar.json";
import { BasicController, BasicController__factory } from "../typechain";

chai.use(solidity);
const { expect } = chai;

describe("Basic Controller", () => {
  let accounts: SignerWithAddress[];
  let creator: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let registrarMock: MockContract;
  let controllerFactory: BasicController__factory;
  let controller: BasicController;

  before(async () => {
    accounts = await ethers.getSigners();
    creator = accounts[0];
    user1 = accounts[1];
    user2 = accounts[2];
    user3 = accounts[3];
  });

  beforeEach("deploys", async () => {
    registrarMock = await deployMockContract(creator, registrar.abi);
    controllerFactory = new BasicController__factory(creator);
    controller = (await upgrades.deployProxy(controllerFactory, [], {
      initializer: "initialize",
    })) as BasicController;
    await controller.deployed();
  });

  describe("deploy", () => {
    it("exists", () => {
      expect(controller.address).to.be.not.null;
    });
  });
});
