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
  const rootDomainId = ethers.constants.HashZero;

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
    controller = (await upgrades.deployProxy(
      controllerFactory,
      [registrarMock.address],
      {
        initializer: "initialize",
      }
    )) as BasicController;
    controller = await controller.deployed();
  });

  describe("register domains", () => {
    it("calls 'registerDomain' on the registrar", async () => {
      const domainName = "myDomain";
      const returnedId = 1337;
      await registrarMock.mock.domainExists.withArgs(0).returns(true);
      await registrarMock.mock.ownerOf.withArgs(0).returns(user1.address);
      await registrarMock.mock.registerDomain.returns(returnedId);

      const controllerAsUser1 = await controller.connect(user1);
      const tx = await controllerAsUser1.registerDomain(
        domainName,
        user1.address
      );

      expect("registerDomain").to.be.calledOnContractWith(registrarMock, [
        ethers.constants.HashZero,
        domainName,
        user1.address,
        user1.address,
      ]);
    });
  });
});
