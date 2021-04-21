import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers, upgrades } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { smockit, MockContract } from "@eth-optimism/smock";

import { StakingController, StakingController__factory } from "../typechain";

chai.use(solidity);
const { expect } = chai;

describe("Staking Controller", () => {
  let accounts: SignerWithAddress[];
  let creator: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let controllerFactory: StakingController__factory;
  let controller: StakingController;
  let MockTokenSmock: MockContract;
  let registrarSmock: MockContract;
  const parentID = 36;
  const bidAmount = 5000;
  const royaltyAmount = 10;
  const name = "name";
  const returnedId = 3636;
  const metadata = "IPFS Hash for metadata";

  before(async () => {
    accounts = await ethers.getSigners();
    creator = accounts[0];
    user1 = accounts[1];
    user2 = accounts[2];
    const ContractFactory = await ethers.getContractFactory("Registrar");
    const Reg = await ContractFactory.deploy();
    await Reg.deployed();
    registrarSmock = await smockit(Reg);
    const ContractFactory2 = await ethers.getContractFactory("MockToken");
    const INF = await ContractFactory2.deploy();
    await INF.deployed();
    MockTokenSmock = await smockit(INF);
    controllerFactory = new StakingController__factory(creator);
    controller = (await upgrades.deployProxy(
      controllerFactory,
      [registrarSmock.address, MockTokenSmock.address],
      {
        initializer: "initialize",
      }
    )) as StakingController;
    controller = await controller.deployed();
  });

  describe("Placing a bid", () => {
    it("emits a DomainBidPlaced event with the correct bid info", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      await registrarSmock.smocked.domainExists.will.return.with(true);
      await registrarSmock.smocked.ownerOf.will.return.with(user1.address);
      const tx = await controllerAsUser1.placeDomainBid(
        parentID,
        bidAmount,
        name
      );
      expect(tx)
        .to.emit(controller, "DomainBidPlaced")
        .withArgs(parentID, 1, bidAmount, name, user1.address);
    });

    it("fails when a user places a bid for a subdomain on a domain that doesnt exist", async () => {
      await registrarSmock.smocked.domainExists.will.return.with(false);
      const controllerAsUser1 = await controller.connect(user1);

      await expect(
        controllerAsUser1.placeDomainBid(parentID, bidAmount, name)
      ).to.be.revertedWith("ZNS: Invalid Domain");
    });
  });

  describe("Accepts a bid", () => {
    it("Fails to allow a user to approve a bid for a domain they do not own", async () => {
      await registrarSmock.smocked.domainExists.will.return.with(true);
      await registrarSmock.smocked.ownerOf.will.return.with(user2.address);
      const controllerAsUser1 = await controller.connect(user1);

      await expect(controllerAsUser1.approveDomainBid(1)).to.be.revertedWith(
        "ZNS: Not Authorized Owner"
      );
    });

    it("Fails to allow a user to approve a bid for a domain that doesnt exist", async () => {
      await registrarSmock.smocked.domainExists.will.return.with(false);
      await registrarSmock.smocked.ownerOf.will.return.with(user1.address);
      const controllerAsUser1 = await controller.connect(user1);

      await expect(controllerAsUser1.approveDomainBid(1)).to.be.revertedWith(
        "ZNS: Invalid Domain"
      );
    });

    it("Fails to allow a user to approve a bid that doesnt exist", async () => {
      await registrarSmock.smocked.domainExists.will.return.with(true);
      await registrarSmock.smocked.ownerOf.will.return.with(user1.address);
      const controllerAsUser1 = await controller.connect(user1);

      await expect(controllerAsUser1.approveDomainBid(5)).to.be.revertedWith(
        "ZNS: Bid doesnt exist"
      );
    });

    it("emits a DomainBidApproved event with the correct bid id", async () => {
      await registrarSmock.smocked.domainExists.will.return.with(true);
      await registrarSmock.smocked.ownerOf.will.return.with(user1.address);
      const controllerAsUser1 = await controller.connect(user1);

      const tx = await controllerAsUser1.approveDomainBid(1);
      expect(tx).to.emit(controller, "DomainBidApproved").withArgs(1);
    });
  });

  describe("FullFilling a bid", () => {
    it("Fails to accept an un-accepted bid", async () => {
      await MockTokenSmock.smocked.transferFrom.will.return.with(true);
      await registrarSmock.smocked.domainExists.will.return.with(true);
      await registrarSmock.smocked.ownerOf.will.return.with(user1.address);
      await registrarSmock.smocked.registerDomain.will.return.with(returnedId);
      await registrarSmock.smocked.setDomainMetadataUri.will.return();
      await registrarSmock.smocked.setDomainRoyaltyAmount.will.return();
      await registrarSmock.smocked.lockDomainMetadataForOwner.will.return();
      await registrarSmock.smocked.transferFrom.will.return();
      const controllerAsUser1 = await controller.connect(user1);
      const lock = true;

      await expect(
        controllerAsUser1.fulfillDomainBid(4, royaltyAmount, metadata, lock)
      ).to.be.revertedWith("ZNS: bid not accepted");
    });

    it("successfully fufills a domain bid", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      const lock = true;

      const tx = await controllerAsUser1.fulfillDomainBid(
        1,
        royaltyAmount,
        metadata,
        lock
      );
      expect(tx)
        .to.emit(controller, "DomainBidFulfilled")
        .withArgs(1, name, user1.address, returnedId, parentID);
    });

    it("Fails to fulfill the same bid twice", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      const lock = true;

      await expect(
        controllerAsUser1.fulfillDomainBid(1, royaltyAmount, metadata, lock)
      ).to.be.revertedWith("ZNS: already fulfilled/withdrawn");
    });
  });
  describe("withdrawing a bid", () => {
    it("Fails to fulfill a withdrawn bid", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      await controllerAsUser1.placeDomainBid(
        parentID,
        bidAmount,
        "another name"
      );
      const controllerAsUser2 = await controller.connect(user2);
      await expect(controllerAsUser2.withdrawBid(2)).to.be.revertedWith(
        "ZNS: Not bid creator"
      );
    });
    it("allows a user to withdraw their bid", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      const tx = await controllerAsUser1.withdrawBid(2);
      expect(tx).to.emit(controller, "BidWithdrawn").withArgs(2);
    });

    it("Fails to fulfill a withdrawn bid", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      const lock = true;

      await expect(
        controllerAsUser1.fulfillDomainBid(2, royaltyAmount, metadata, lock)
      ).to.be.revertedWith("ZNS: already fulfilled/withdrawn");
    });

    it("Fails to withdraw an accepted bid", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      await expect(controllerAsUser1.withdrawBid(1)).to.be.revertedWith(
        "ZNS: Bid already accepted"
      );
    });
  });
  describe("Relenquishing Ownership of a domain and re-staking it to a new user", () => {
    it("Allows the owner of a domain to relenquish ownership and returns their stake", async () => {
      await MockTokenSmock.smocked.transfer.will.return.with(true);
      await registrarSmock.smocked.domainExists.will.return.with(true);
      await registrarSmock.smocked.ownerOf.will.return.with(user1.address);
      await registrarSmock.smocked.transferFrom.will.return();
      const controllerAsUser1 = await controller.connect(user1);
      const lock = true;

      const tx = await controllerAsUser1.relenquishOwnership(1);
      expect(tx).to.emit(controller, "TokenOwnershipRelenquished").withArgs(1);
    });
  });
});
