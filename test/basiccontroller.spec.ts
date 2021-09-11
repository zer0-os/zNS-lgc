import { ethers, upgrades, waffle } from "hardhat";
import chai from "chai";
import { MockContract, solidity } from "ethereum-waffle";

import * as registrar from "../artifacts/contracts/Registrar.sol/Registrar.json";
import { BasicController, BasicController__factory } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

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

  describe("register top level domains", () => {
    before("deploys", async () => {
      registrarMock = await waffle.deployMockContract(creator, registrar.abi);
      controllerFactory = new BasicController__factory(creator);
      controller = (await upgrades.deployProxy(
        controllerFactory,
        [registrarMock.address],
        {
          initializer: "initialize",
        }
      )) as unknown as BasicController;
      controller = await controller.deployed();
    });

    it("emits a RegisteredDomain event with the created domain id", async () => {
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

      expect(tx)
        .to.emit(controller, "RegisteredDomain")
        .withArgs(domainName, returnedId, 0, user1.address, user1.address);
    });

    it("prevents a user who is not the root domain owner from making a domain", async () => {
      const domainName = "myDomain";
      const returnedId = 1337;
      await registrarMock.mock.domainExists.withArgs(0).returns(true);
      await registrarMock.mock.ownerOf.withArgs(0).returns(user1.address);
      await registrarMock.mock.registerDomain.returns(returnedId);

      const controllerAsUser2 = await controller.connect(user2);
      const tx = controllerAsUser2.registerDomain(domainName, user1.address);

      await expect(tx).to.be.revertedWith("Zer0 Controller: Not Authorized");
    });
  });

  describe("register sub domains", () => {
    const topLevelDomainId = 80008;

    before("deploys", async () => {
      registrarMock = await waffle.deployMockContract(creator, registrar.abi);
      controllerFactory = new BasicController__factory(creator);
      controller = (await upgrades.deployProxy(
        controllerFactory,
        [registrarMock.address],
        {
          initializer: "initialize",
        }
      )) as unknown as BasicController;
      controller = await controller.deployed();
    });

    it("emits a RegisteredSubdomain event with the created domain id", async () => {
      const domainName = "mySubDomain";
      const returnedId = 13361357;
      await registrarMock.mock.domainExists
        .withArgs(topLevelDomainId)
        .returns(true);
      await registrarMock.mock.ownerOf
        .withArgs(topLevelDomainId)
        .returns(user2.address);
      await registrarMock.mock.registerDomain.returns(returnedId);

      const controllerAsUser2 = await controller.connect(user2);
      const tx = await controllerAsUser2.registerSubdomain(
        topLevelDomainId,
        domainName,
        user2.address
      );

      expect(tx)
        .to.emit(controller, "RegisteredDomain")
        .withArgs(
          domainName,
          returnedId,
          topLevelDomainId,
          user2.address,
          user2.address
        );
    });

    it("prevents a user who is not the owner of a domain from creating sub domains", async () => {
      const domainName = "mySubDomain";
      const returnedId = 13361357;

      await registrarMock.mock.domainExists
        .withArgs(topLevelDomainId)
        .returns(true);
      await registrarMock.mock.ownerOf
        .withArgs(topLevelDomainId)
        .returns(user2.address);
      await registrarMock.mock.registerDomain.returns(returnedId);

      const controllerAsUser3 = await controller.connect(user3);
      const tx = controllerAsUser3.registerSubdomain(
        topLevelDomainId,
        domainName,
        user3.address
      );

      await expect(tx).to.be.revertedWith("Zer0 Controller: Not Authorized");
    });

    it("prevents creating subdomains on domains with no parent", async () => {
      const parentId = 11111;
      const domainName = "mySubDomain";
      const returnedId = 13361357;

      await registrarMock.mock.ownerOf
        .withArgs(parentId)
        .revertsWithReason("ERC721: owner query for nonexistent token");
      await registrarMock.mock.domainExists.withArgs(parentId).returns(false);
      await registrarMock.mock.registerDomain.returns(returnedId);

      const controllerAsUser2 = await controller.connect(user2);
      const tx = controllerAsUser2.registerSubdomain(
        parentId,
        domainName,
        user2.address
      );

      await expect(tx).to.be.revertedWith(
        "ERC721: owner query for nonexistent token"
      );
    });
  });
});
