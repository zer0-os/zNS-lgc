import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers, upgrades } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { smockit, MockContract } from "@eth-optimism/smock";

import { StakingController, StakingController__factory } from "../typechain";
import { calculateDomainHash, hashDomainName } from "./helpers";

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
  const parentID = 0;
  const bidAmount = 5000;
  const royaltyAmount = 10;
  const name = "name";
  const returnedId = 3636;
  const metadata = "IPFS Hash for metadata";
  const requestUri = "IPFS hash of request metadata";

  before(async () => {
    accounts = await ethers.getSigners();
    creator = accounts[0];
    user1 = accounts[1];
    user2 = accounts[2];

    const registrar = await (
      await ethers.getContractFactory("Registrar")
    ).deploy();
    await registrar.deployed();

    registrarSmock = await smockit(registrar);
    const mockToken = await (
      await ethers.getContractFactory("MockToken")
    ).deploy();
    await mockToken.deployed();

    MockTokenSmock = await smockit(mockToken);
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
    it("emits a DomainRequestPlaced event with the correct bid info", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      await registrarSmock.smocked.domainExists.will.return.with(true);
      await registrarSmock.smocked.ownerOf.will.return.with(user1.address);

      const tx = await controllerAsUser1.placeDomainRequest(
        parentID,
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
      await registrarSmock.smocked.domainExists.will.return.with(false);
      const controllerAsUser1 = await controller.connect(user1);

      await expect(
        controllerAsUser1.placeDomainRequest(
          parentID,
          bidAmount,
          name,
          requestUri
        )
      ).to.be.revertedWith("Staking Controller: Invalid Domain");
    });
  });

  describe("Accepts a bid", () => {
    it("Fails to allow a user to approve a bid for a domain they do not own", async () => {
      await registrarSmock.smocked.ownerOf.will.return.with(user2.address);
      const controllerAsUser1 = await controller.connect(user1);

      await expect(
        controllerAsUser1.approveDomainRequest(1)
      ).to.be.revertedWith("Staking Controller: Not Authorized Owner");
    });

    it("Fails to allow a user to approve a bid for a domain that doesnt exist", async () => {
      await registrarSmock.smocked.ownerOf.will.revert();
      const controllerAsUser1 = await controller.connect(user1);

      await expect(controllerAsUser1.approveDomainRequest(1)).to.be.reverted;
    });

    it("Fails to allow a user to approve a bid that doesnt exist", async () => {
      await registrarSmock.smocked.domainExists.will.return.with(true);
      await registrarSmock.smocked.ownerOf.will.return.with(user1.address);
      const controllerAsUser1 = await controller.connect(user1);

      await expect(
        controllerAsUser1.approveDomainRequest(5)
      ).to.be.revertedWith("Staking Controller: Request doesnt exist");
    });

    it("emits a DomainRequestApproved event with the correct bid id", async () => {
      await registrarSmock.smocked.domainExists.will.return.with(true);
      await registrarSmock.smocked.ownerOf.will.return.with(user1.address);
      const controllerAsUser1 = await controller.connect(user1);

      const tx = await controllerAsUser1.approveDomainRequest(1);
      expect(tx).to.emit(controller, "DomainRequestApproved").withArgs(1);
    });
  });

  describe("FullFilling a bid", () => {
    it("Fails to accept an un-accepted bid", async () => {
      await MockTokenSmock.smocked.transferFrom.will.return.with(true);
      await registrarSmock.smocked.domainExists.will.return.with(false);
      await registrarSmock.smocked.ownerOf.will.return.with(user1.address);
      await registrarSmock.smocked.registerDomain.will.return.with(returnedId);
      await registrarSmock.smocked.setDomainMetadataUri.will.return();
      await registrarSmock.smocked.setDomainRoyaltyAmount.will.return();
      await registrarSmock.smocked.lockDomainMetadataForOwner.will.return();
      await registrarSmock.smocked[
        "safeTransferFrom(address,address,uint256)"
      ].will.return();
      registrarSmock.smocked.safeTransferFrom =
        registrarSmock.smocked["safeTransferFrom(address,address,uint256)"];
      const controllerAsUser1 = await controller.connect(user1);
      const lock = true;

      await expect(
        controllerAsUser1.fulfillDomainRequest(4, royaltyAmount, metadata, lock)
      ).to.be.revertedWith("Staking Controller: Only requester may fulfill.");
    });

    it("successfully fufills a domain bid", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      const lock = true;

      let expectedId = calculateDomainHash(
        ethers.constants.HashZero,
        hashDomainName(name)
      );

      await registrarSmock.smocked.registerDomain.will.return.with(expectedId);
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
      ).to.be.revertedWith("Staking Controller: Request not valid");
    });
  });

  describe("withdrawing a bid", () => {
    it("Fails to fulfill a withdrawn bid", async () => {
      await registrarSmock.smocked.domainExists.will.return.with(true);
      const controllerAsUser1 = await controller.connect(user1);
      await controllerAsUser1.placeDomainRequest(
        parentID,
        bidAmount,
        "another name",
        ""
      );
      const controllerAsUser2 = await controller.connect(user2);
      await expect(controllerAsUser2.withdrawRequest(2)).to.be.revertedWith(
        "Staking Controller: Not Requestor"
      );
    });

    it("allows a user to withdraw their bid", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      const tx = await controllerAsUser1.withdrawRequest(2);
      expect(tx).to.emit(controller, "RequestWithdrawn").withArgs(2);
    });

    it("Fails to fulfill a withdrawn bid", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      const lock = true;

      await expect(
        controllerAsUser1.fulfillDomainRequest(2, royaltyAmount, metadata, lock)
      ).to.be.revertedWith("Staking Controller: Request not valid");
    });

    it("Fails to withdraw an accepted bid", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      await expect(controllerAsUser1.withdrawRequest(1)).to.be.revertedWith(
        "Staking Controller: Request is invalid"
      );
    });
  });

  describe("bid nonce", () => {
    it("submits a bid on a domain", async () => {
      const controllerAsUser1 = await controller.connect(user1);

      await registrarSmock.smocked.domainExists.will.return.with(true);
      await registrarSmock.smocked.ownerOf.will.return.with(user1.address);

      const tx = await controllerAsUser1.placeDomainRequest(
        parentID,
        bidAmount,
        name,
        requestUri
      );

      const expectedNonce = 1;

      expect(tx)
        .to.emit(controller, "DomainRequestPlaced")
        .withArgs(
          parentID,
          3,
          bidAmount,
          requestUri,
          name,
          user1.address,
          expectedNonce
        );
    });

    it("submits a second bid on a domain", async () => {
      const controllerAsUser1 = await controller.connect(user1);

      await registrarSmock.smocked.domainExists.will.return.with(true);
      await registrarSmock.smocked.ownerOf.will.return.with(user1.address);

      const tx = await controllerAsUser1.placeDomainRequest(
        parentID,
        bidAmount,
        name,
        requestUri
      );

      const expectedNonce = 1;

      expect(tx)
        .to.emit(controller, "DomainRequestPlaced")
        .withArgs(
          parentID,
          4,
          bidAmount,
          requestUri,
          name,
          user1.address,
          expectedNonce
        );
    });

    it("submits a third bid on a domain", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      await controllerAsUser1.placeDomainRequest(
        parentID,
        bidAmount,
        name,
        requestUri
      );
    });

    it("accepts first two bids", async () => {
      await registrarSmock.smocked.ownerOf.will.return.with(creator.address);
      await controller.approveDomainRequest(3);
      await controller.approveDomainRequest(4);
    });

    it("fulfills the first bid", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      await controllerAsUser1.fulfillDomainRequest(3, 0, "meta", true);
    });

    it("fails to fulfill the second bid", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      await expect(
        controllerAsUser1.fulfillDomainRequest(4, 0, "meta", true)
      ).to.be.revertedWith("Staking Controller: Request is outdated");
    });

    it("fails to accept the third bid", async () => {
      await expect(controller.approveDomainRequest(5)).to.be.revertedWith(
        "Staking Controller: Request is outdated"
      );
    });

    it("fails to withdraw the third bid", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      await expect(controllerAsUser1.withdrawRequest(5)).to.be.revertedWith(
        "Staking Controller: Request is outdated"
      );
    });
  });
});
