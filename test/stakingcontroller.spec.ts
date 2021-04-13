import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers, upgrades } from "hardhat";
import chai from "chai";
import { deployMockContract, MockContract, solidity } from "ethereum-waffle";


import * as registrar from "../artifacts/contracts/Registrar.sol/Registrar.json";
import * as infinity from "../artifacts/contracts/mocks/Infinity.sol/Infinity.json";

import { StakingController, StakingController__factory } from "../typechain";

chai.use(solidity);
const { expect } = chai;


describe("Staking Controller", () => {
  let accounts: SignerWithAddress[];
  let creator: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let registrarMock: MockContract;
  let controllerFactory: StakingController__factory;
  let controller: StakingController;
  let infinityMock: MockContract;


  before(async () => {
    accounts = await ethers.getSigners();
    creator = accounts[0];
    user1 = accounts[1];
    user2 = accounts[2];
    user3 = accounts[3];
    registrarMock = await deployMockContract(creator, registrar.abi);
    infinityMock = await deployMockContract(creator, infinity.abi);

    controllerFactory = new StakingController__factory(creator);
    controller = (await upgrades.deployProxy(
      controllerFactory,
      [registrarMock.address, infinityMock.address],
      {
        initializer: "initialize",
      }
    )) as StakingController;
    controller = await controller.deployed();
  });

  describe("tests recovery", () => {
    it("checks that the recovered address matches the message signers address", async () => {
      const parentID = 36;
      const bidAmount = 5000;
      const royaltyAmount = 10;
      const bidIPFSHash = "IPFS Hash For Bid";
      const name = "name";
      const msg = "tacos";
      const msgHash = ethers.utils.id(msg);
      const payload = await ethers.utils.defaultAbiCoder.encode(
        ["bytes32"],
        [msgHash]
      );

      // const payload = await ethers.utils.defaultAbiCoder.encode(
      //   ["uint256","string","uint256","string"],
      //   [bidAmount,name,parentID,bidIPFSHash]
      // );
      const payloadHash = await ethers.utils.keccak256(payload);
      const bidSignature = await user1.signMessage(await ethers.utils.arrayify(payloadHash))
      // //verifyMessage works here
      // const ethersRecoveredAddress = await ethers.utils.verifyMessage( payloadHash, bidSignature);
      // //this works
      // expect(ethersRecoveredAddress).to.eq(user1.address);
      ////trying this exact same recovery process on chain here fails tho
      const controllerAsUser1 = await controller.connect(user1);
      const recoveredAddress = await controllerAsUser1.recover(
        payloadHash,
        bidSignature
      );
      expect(recoveredAddress).to.eq(user1.address);
    });
  });

  describe("Places a bid", () => {
    it("emits a DomainBidPlaced event with the correct bid info", async () => {
      const parentID = 36;
      const bidAmount = 5000;
      const royaltyAmount = 10;
      const bidIPFSHash = "IPFS Hash For Bid";
      const name = "name";
      const bidRequestHash = await ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["uint256","string","uint256","string"], [bidAmount,name,parentID,bidIPFSHash]));
      const bidSignature = await user1.signMessage(bidRequestHash);

      const controllerAsUser1 = await controller.connect(user1);
      const tx = await controllerAsUser1.placeDomainBid(
        bidRequestHash,
        bidSignature,
        bidIPFSHash
      );

      expect(tx)
        .to.emit(controller, "DomainBidPlaced")
        .withArgs(bidRequestHash, bidIPFSHash, bidSignature);
      });
    });

    describe("Accepts a bid", () => {
      it("emits a DomainBidApproved event with the correct bid id", async () => {
        const parentID = 36;
        const bidAmount = 5000;
        const royaltyAmount = 10;
        const bidIPFSHash = "IPFS Hash For Bid";
        const name = "name";
        const bidRequestHash = await ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["uint256","string","uint256","string"], [bidAmount,name,parentID,bidIPFSHash]));
        await registrarMock.mock.domainExists.withArgs(parentID).returns(true);
        await registrarMock.mock.ownerOf.withArgs(parentID).returns(user1.address);


        const controllerAsUser1 = await controller.connect(user1);
        const tx = await controllerAsUser1.approveDomainBid(
          parentID,
          bidIPFSHash,
          bidRequestHash
        );

        expect(tx)
          .to.emit(controller, "DomainBidApproved")
          .withArgs(bidIPFSHash);
        });
      });

      describe("FullFills a bid", () => {
        it("emits a DomainBidFulfilled event with the correct bid id", async () => {
          const parentID = 36;
          const bidAmount = 5000;
          const royaltyAmount = 10;
          const bidIPFSHash = "IPFS Hash For Bid";
          const name = "name";
          const bidRequestHash = await ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["uint256","string","uint256","string"], [bidAmount,name,parentID,bidIPFSHash]));
          const bidSignature = await user1.signMessage(bidRequestHash);
          const lock = true;

          const returnedId = 3636;

          await registrarMock.mock.domainExists.withArgs(parentID).returns(true);
          await registrarMock.mock.ownerOf.withArgs(parentID).returns(user1.address);
          await registrarMock.mock.registerDomain.returns(returnedId);
          await registrarMock.mock.setDomainMetadataUri.reverts();
          // cant figure out how to get function without a return on it
          // probably need to move this test into the e2e test script
          // await registrarMock.mock.setDomainRoyaltyAmount.returns(true);
          // await registrarMock.mock.registerDomain.returns(true);
          // await infinityMock.mock.transferFrom.returns(true);

          const controllerAsUser1 = await controller.connect(user1);
          const tx = await controllerAsUser1.fulfillDomainBid(
            parentID,
            bidAmount,
            royaltyAmount,
            bidIPFSHash,
            name,
            bidSignature,
            lock
          );

          expect(tx)
            .to.emit(controller, "DomainBidFulfilled")
            .withArgs(bidIPFSHash);
          });
        });

  });
