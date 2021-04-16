import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers, upgrades } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { smockit, MockContract } from "@eth-optimism/smock";

import * as registrar from "../artifacts/contracts/Registrar.sol/Registrar.json";
import * as MockToken from "../artifacts/contracts/mocks/MockToken.sol/MockToken.json";

import {
  StakingController,
  StakingController__factory,
  Registrar,
} from "../typechain";

chai.use(solidity);
const { expect } = chai;

describe("Staking Controller", () => {
  let accounts: SignerWithAddress[];
  let creator: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let controllerFactory: StakingController__factory;
  let controller: StakingController;
  let MockTokenSmock: MockContract;
  let registrarSmock: MockContract;
  const parentID = 36;
  const bidAmount = 5000;
  const royaltyAmount = 10;
  const bidIPFSHash = "IPFS Hash For Bid";
  const name = "name";
  const returnedId = 3636;
  const metadata = "IPFS Hash for metadata";

  before(async () => {
    accounts = await ethers.getSigners();
    creator = accounts[0];
    user1 = accounts[1];
    user2 = accounts[2];
    user3 = accounts[3];
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

  describe("tests recovery", () => {
    it("checks that the recovered address matches the message signers address", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      const bidRequestHash = await controllerAsUser1.createBid(
        parentID,
        bidAmount,
        bidIPFSHash,
        name
      );
      const bidSignature = await user1.signMessage(
        await ethers.utils.arrayify(bidRequestHash)
      );
      const recoveredAddress = await controllerAsUser1.recover(
        bidRequestHash,
        bidSignature
      );
      expect(recoveredAddress).to.eq(user1.address);
    });

    it("checks that the recovered address does not the message signers address", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      const bidRequestHash = await controllerAsUser1.createBid(
        parentID,
        bidAmount,
        bidIPFSHash,
        name
      );
      const bidSignature = await user2.signMessage(
        await ethers.utils.arrayify(bidRequestHash)
      );
      const recoveredAddress = await controllerAsUser1.recover(
        bidRequestHash,
        bidSignature
      );
      expect(recoveredAddress).to.not.equal(user1.address);
    });
  });

  describe("Placing a bid", () => {
    it("emits a DomainBidPlaced event with the correct bid info", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      const bidRequestHash = await controllerAsUser1.createBid(
        parentID,
        bidAmount,
        bidIPFSHash,
        name
      );
      const bidSignature = await user1.signMessage(
        await ethers.utils.arrayify(bidRequestHash)
      );
      await registrarSmock.smocked.domainExists.will.return.with(true);
      await registrarSmock.smocked.ownerOf.will.return.with(user1.address);
      const tx = await controllerAsUser1.placeDomainBid(
        parentID,
        bidRequestHash,
        bidSignature,
        bidIPFSHash
      );
      expect(tx)
        .to.emit(controller, "DomainBidPlaced")
        .withArgs(bidRequestHash, bidIPFSHash, bidSignature);
    });

    it("fails when a user places a bid for a subdomain on a domain that doesnt exist", async () => {
      await registrarSmock.smocked.domainExists.will.return.with(false);
      const controllerAsUser1 = await controller.connect(user1);
      const bidRequestHash = await controllerAsUser1.createBid(
        parentID,
        bidAmount,
        bidIPFSHash,
        name
      );
      const bidSignature = await user1.signMessage(
        await ethers.utils.arrayify(bidRequestHash)
      );
      await expect(
        controllerAsUser1.placeDomainBid(
          parentID,
          bidRequestHash,
          bidSignature,
          bidIPFSHash
        )
      ).to.be.revertedWith("Zer0 Naming Service: Invalid Domain");
    });
  });

  describe("Accepts a bid", () => {
    it("emits a DomainBidApproved event with the correct bid id", async () => {
      await registrarSmock.smocked.domainExists.will.return.with(true);
      await registrarSmock.smocked.ownerOf.will.return.with(user1.address);
      const controllerAsUser1 = await controller.connect(user1);
      const bidRequestHash = await controllerAsUser1.createBid(
        parentID,
        bidAmount,
        bidIPFSHash,
        name
      );
      const bidSignature = await user1.signMessage(
        await ethers.utils.arrayify(bidRequestHash)
      );

      const tx = await controllerAsUser1.approveDomainBid(
        parentID,
        bidIPFSHash,
        bidSignature
      );
      expect(tx).to.emit(controller, "DomainBidApproved").withArgs(bidIPFSHash);
    });

    it("Fails to allow a user to approve a bid for a domain they do not own", async () => {
      await registrarSmock.smocked.domainExists.will.return.with(true);
      await registrarSmock.smocked.ownerOf.will.return.with(user2.address);
      const controllerAsUser1 = await controller.connect(user1);
      const bidRequestHash = await controllerAsUser1.createBid(
        parentID,
        bidAmount,
        bidIPFSHash,
        name
      );
      const bidSignature = await user1.signMessage(
        await ethers.utils.arrayify(bidRequestHash)
      );

      await expect(
        controllerAsUser1.approveDomainBid(parentID, bidIPFSHash, bidSignature)
      ).to.be.revertedWith("Zer0 Naming Service: Not Authorized Owner");
    });
  });

  describe("FullFilling a bid", () => {
    it("fails when recipient doesnt match recovered address", async () => {
      await MockTokenSmock.smocked.transferFrom.will.return.with(true);
      await registrarSmock.smocked.domainExists.will.return.with(true);
      await registrarSmock.smocked.ownerOf.will.return.with(user1.address);
      await registrarSmock.smocked.registerDomain.will.return.with(returnedId);
      await registrarSmock.smocked.setDomainMetadataUri.will.return();
      await registrarSmock.smocked.setDomainRoyaltyAmount.will.return();
      await registrarSmock.smocked.lockDomainMetadataForOwner.will.return();
      await registrarSmock.smocked.transferFrom.will.return();
      const controllerAsUser1 = await controller.connect(user1);
      const bidRequestHash = await controllerAsUser1.createBid(
        parentID,
        bidAmount,
        bidIPFSHash,
        name
      );
      const bidSignature = await user2.signMessage(
        await ethers.utils.arrayify(bidRequestHash)
      );
      const lock = true;
      await expect(
        controllerAsUser1.fulfillDomainBid(
          parentID,
          bidAmount,
          royaltyAmount,
          bidIPFSHash,
          name,
          metadata,
          bidSignature,
          lock,
          user1.address
        )
      ).to.be.revertedWith(
        "Zer0 Naming Service: bid info doesnt match msg/ doesnt exist"
      );
    });

    it("fails when the bid amount in the message doesnt match IPFS bid amount", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      const bidRequestHash = await controllerAsUser1.createBid(
        parentID,
        10,
        bidIPFSHash,
        name
      );
      const bidSignature = await user1.signMessage(
        await ethers.utils.arrayify(bidRequestHash)
      );
      const lock = true;
      await expect(
        controllerAsUser1.fulfillDomainBid(
          parentID,
          bidAmount,
          royaltyAmount,
          bidIPFSHash,
          name,
          metadata,
          bidSignature,
          lock,
          user1.address
        )
      ).to.be.revertedWith(
        "Zer0 Naming Service: bid info doesnt match msg/ doesnt exist"
      );
    });

    it("fails when the name in the message doesnt match the IPFS name", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      const bidRequestHash = await controllerAsUser1.createBid(
        parentID,
        bidAmount,
        bidIPFSHash,
        "Wrong Name"
      );
      const bidSignature = await user1.signMessage(
        await ethers.utils.arrayify(bidRequestHash)
      );
      const lock = true;
      await expect(
        controllerAsUser1.fulfillDomainBid(
          parentID,
          bidAmount,
          royaltyAmount,
          bidIPFSHash,
          name,
          metadata,
          bidSignature,
          lock,
          user1.address
        )
      ).to.be.revertedWith(
        "Zer0 Naming Service: bid info doesnt match msg/ doesnt exist"
      );
    });

    it("fails when the parent id in the message doesnt match the IPFS parent ID", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      const bidRequestHash = await controllerAsUser1.createBid(
        50,
        bidAmount,
        bidIPFSHash,
        name
      );
      const bidSignature = await user1.signMessage(
        await ethers.utils.arrayify(bidRequestHash)
      );
      const lock = true;
      await expect(
        controllerAsUser1.fulfillDomainBid(
          parentID,
          bidAmount,
          royaltyAmount,
          bidIPFSHash,
          name,
          metadata,
          bidSignature,
          lock,
          user1.address
        )
      ).to.be.revertedWith(
        "Zer0 Naming Service: bid info doesnt match msg/ doesnt exist"
      );
    });

    it("fails when the encodeded IPFS hash in the message doesnt match the input IPFS ", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      const bidRequestHash = await controllerAsUser1.createBid(
        parentID,
        bidAmount,
        "Wrong IPFS Hash",
        name
      );
      const bidSignature = await user1.signMessage(
        await ethers.utils.arrayify(bidRequestHash)
      );
      const lock = true;
      await expect(
        controllerAsUser1.fulfillDomainBid(
          parentID,
          bidAmount,
          royaltyAmount,
          bidIPFSHash,
          name,
          metadata,
          bidSignature,
          lock,
          user1.address
        )
      ).to.be.revertedWith(
        "Zer0 Naming Service: bid info doesnt match msg/ doesnt exist"
      );
    });

    it("fails when a bid doesnt exist", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      const bidRequestHash = await controllerAsUser1.createBid(
        parentID,
        bidAmount,
        bidIPFSHash,
        name
      );
      const bidSignature = await user1.signMessage(
        await ethers.utils.arrayify(bidRequestHash)
      );
      const lock = true;
      await expect(
        controllerAsUser1.fulfillDomainBid(
          parentID,
          bidAmount,
          royaltyAmount,
          "Nonexistent bid",
          name,
          metadata,
          bidSignature,
          lock,
          user1.address
        )
      ).to.be.revertedWith(
        "Zer0 Naming Service: bid info doesnt match msg/ doesnt exist"
      );
    });

    it("emits a DomainBidFulfilled event with the correct bid id", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      const bidRequestHash = await controllerAsUser1.createBid(
        parentID,
        bidAmount,
        bidIPFSHash,
        name
      );
      const bidSignature = await user1.signMessage(
        await ethers.utils.arrayify(bidRequestHash)
      );
      const lock = true;
      const tx = await controllerAsUser1.fulfillDomainBid(
        parentID,
        bidAmount,
        royaltyAmount,
        bidIPFSHash,
        name,
        metadata,
        bidSignature,
        lock,
        user1.address
      );
      expect(tx)
        .to.emit(controller, "DomainBidFulfilled")
        .withArgs(metadata, name, user1.address, returnedId, parentID);
    });

    it("emits a DomainBidFulfilled event with the correct bid id", async () => {
      const controllerAsUser1 = await controller.connect(user1);
      const bidRequestHash = await controllerAsUser1.createBid(
        parentID,
        bidAmount,
        bidIPFSHash,
        name
      );
      const bidSignature = await user1.signMessage(
        await ethers.utils.arrayify(bidRequestHash)
      );
      const lock = true;
      await expect(
        controllerAsUser1.fulfillDomainBid(
        parentID,
        bidAmount,
        royaltyAmount,
        bidIPFSHash,
        name,
        metadata,
        bidSignature,
        lock,
        user1.address
      )).to.be.revertedWith(
        "Zer0 Naming Service: has been fullfilled"
      );
    });

  });
});
