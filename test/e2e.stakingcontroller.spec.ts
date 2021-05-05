import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import {
  smockit,
  MockContract,
  smoddit,
  ModifiableContract,
} from "@eth-optimism/smock";

import {
  Registrar,
  StakingController,
  StakingController__factory,
} from "../typechain";
import { calculateDomainHash, hashDomainName } from "./helpers";

chai.use(solidity);
const { expect } = chai;

describe("Staking Controller", () => {
  let accounts: SignerWithAddress[];
  let creator: SignerWithAddress;
  let user1: SignerWithAddress;
  let controllerFactory: StakingController__factory;
  let controller: StakingController;
  let mockTokenSmock: MockContract;
  let registrar: Registrar | ModifiableContract;
  const parentID = 0;
  const bidAmount = 5000;
  const royaltyAmount = 10;
  const name = "name";
  const metadata = "IPFS Hash for metadata";
  const requestUri = "IPFS hash of request metadata";

  before(async () => {
    accounts = await ethers.getSigners();
    creator = accounts[0];
    user1 = accounts[1];

    const registrarFactory = await smoddit("Registrar");
    registrar = await registrarFactory.deploy();

    await registrar.initialize();

    await registrar.addController(creator.address);

    const mockToken = await (
      await ethers.getContractFactory("MockToken")
    ).deploy();
    await mockToken.deployed();

    mockTokenSmock = await smockit(mockToken);
    controllerFactory = new StakingController__factory(creator);
    controller = await controllerFactory.deploy();
    await controller.initialize(registrar.address, mockTokenSmock.address);

    await registrar.addController(controller.address);
  });

  describe("Placing a bid", () => {
    it("emits a DomainRequestPlaced event with the correct bid info", async () => {
      const controllerAsUser1 = await controller.connect(user1);

      const tx = await controllerAsUser1.placeDomainRequest(
        ethers.constants.HashZero,
        bidAmount,
        name,
        requestUri
      );

      const expectedNonce = 0;

      expect(tx)
        .to.emit(controller, "DomainRequestPlaced")
        .withArgs(
          parentID,
          1,
          bidAmount,
          requestUri,
          name,
          user1.address,
          expectedNonce
        );
    });

    it("fails when a user places a bid for a subdomain on a domain that doesnt exist", async () => {
      const controllerAsUser1 = await controller.connect(user1);

      await expect(
        controllerAsUser1.placeDomainRequest(1234, bidAmount, name, requestUri)
      ).to.be.revertedWith("Staking Controller: Invalid Domain");
    });
  });

  describe("Accepts a bid", () => {
    it("Fails to allow a user to approve a bid for a domain they do not own", async () => {
      const controllerAsUser1 = await controller.connect(user1);

      await expect(
        controllerAsUser1.approveDomainRequest(1)
      ).to.be.revertedWith("Staking Controller: Not Authorized Owner");
    });

    it("Fails to allow a user to approve a bid that doesn't exist", async () => {
      const controllerAsUser1 = await controller.connect(user1);

      await expect(
        controllerAsUser1.approveDomainRequest(5)
      ).to.be.revertedWith("Staking Controller: Request doesn't exist");
    });

    it("emits a DomainRequestApproved event with the correct bid id", async () => {
      const tx = await controller.approveDomainRequest(1);
      expect(tx).to.emit(controller, "DomainRequestApproved").withArgs(1);
    });
  });

  describe("FullFilling a bid", () => {
    it("Fails to accept an un-accepted bid", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      const lock = true;

      await expect(
        controllerAsUser1.fulfillDomainRequest(4, royaltyAmount, metadata, lock)
      ).to.be.revertedWith("Staking Controller: Only requester may fulfill.");
    });

    it("successfully fulfills a domain bid", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      const lock = true;

      const expectedId = calculateDomainHash(
        ethers.constants.HashZero,
        hashDomainName(name)
      );

      await mockTokenSmock.smocked.transferFrom.will.return.with(true);

      const tx = await controllerAsUser1.fulfillDomainRequest(
        1,
        royaltyAmount,
        metadata,
        lock
      );

      const expectedNonce = 1;

      expect(tx)
        .to.emit(controller, "DomainRequestFulfilled")
        .withArgs(1, name, user1.address, expectedId, parentID, expectedNonce);
    });

    it("Fails to fulfill the same bid twice", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      const lock = true;

      await expect(
        controllerAsUser1.fulfillDomainRequest(1, royaltyAmount, metadata, lock)
      ).to.be.revertedWith("Staking Controller: Request is outdated");
    });
  });

  describe("bid nonce", () => {
    const otherDomainName = "name2";

    it("submits two bids on a domain", async () => {
      const controllerAsUser1 = await controller.connect(user1);

      const tx = await controllerAsUser1.placeDomainRequest(
        parentID,
        bidAmount,
        otherDomainName,
        requestUri
      );

      const expectedNonce = 0;

      expect(tx)
        .to.emit(controller, "DomainRequestPlaced")
        .withArgs(
          parentID,
          2,
          bidAmount,
          requestUri,
          otherDomainName,
          user1.address,
          expectedNonce
        );

      await controllerAsUser1.placeDomainRequest(
        parentID,
        bidAmount,
        otherDomainName,
        requestUri
      );
    });

    it("submits a third bid on a domain", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      await controllerAsUser1.placeDomainRequest(
        parentID,
        bidAmount,
        otherDomainName,
        requestUri
      );
    });

    it("accepts first two bids", async () => {
      await controller.approveDomainRequest(2);
      await controller.approveDomainRequest(3);
    });

    it("fulfills the first bid", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      await controllerAsUser1.fulfillDomainRequest(2, 0, "meta", true);
    });

    it("fails to fulfill the second bid", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      await expect(
        controllerAsUser1.fulfillDomainRequest(3, 0, "meta", true)
      ).to.be.revertedWith("Staking Controller: Request is outdated");
    });

    it("fails to accept the third bid", async () => {
      await expect(controller.approveDomainRequest(4)).to.be.revertedWith(
        "Staking Controller: Request is outdated"
      );
    });
  });
});
