import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers, upgrades } from "hardhat";
import chai from "chai";
import { deployMockContract, MockContract, solidity } from "ethereum-waffle";
import { smockit } from '@eth-optimism/smock'


import * as registrar from "../artifacts/contracts/Registrar.sol/Registrar.json";
import * as infinity from "../artifacts/contracts/mocks/Infinity.sol/Infinity.json";

import { StakingController, StakingController__factory, Registrar } from "../typechain";

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
  const parentID = 36;
  const bidAmount = 5000;
  const royaltyAmount = 10;
  const bidIPFSHash = "IPFS Hash For Bid";
  const name = "name";


  before(async () => {
    accounts = await ethers.getSigners();
    creator = accounts[0];
    user1 = accounts[1];
    user2 = accounts[2];
    user3 = accounts[3];
    infinityMock = await deployMockContract(creator, infinity.abi);
    const ContractFactory = await ethers.getContractFactory('Registrar');
    const Reg = await ContractFactory.deploy();
    await Reg.deployed();

    const registrarSmock = await smockit(Reg);

    controllerFactory = new StakingController__factory(creator);
    controller = (await upgrades.deployProxy(
      controllerFactory,
      [registrarSmock.address, infinityMock.address],
      {
        initializer: "initialize",
      }
    )) as StakingController;
    controller = await controller.deployed();
    await infinityMock.mock.transferFrom.returns(true);

    await registrarSmock.smocked.domainExists.will.return.with(true);
    await registrarSmock.smocked.ownerOf.will.return.with(user1.address);
    await registrarSmock.smocked.registerDomain.will.return.with(user1.address);
    await registrarSmock.smocked.setDomainMetadataUri.will.return();
    await registrarSmock.smocked.setDomainRoyaltyAmount.will.return();
    await registrarSmock.smocked.lockDomainMetadataForOwner.will.return();
    await registrarSmock.smocked.transferFrom.will.return();

  });

  describe("tests recovery", () => {
    it("checks that the recovered address matches the message signers address", async () => {

      const bidRequestHash = await ethers.utils.keccak256(
        await ethers.utils.defaultAbiCoder.encode(
        ["uint256","string","uint256","string"],
        [bidAmount,name,parentID,bidIPFSHash]
      )
    );
      const bidSignature = await user1.signMessage(await ethers.utils.arrayify(bidRequestHash))

      const controllerAsUser1 = await controller.connect(user1);
      const recoveredAddress = await controllerAsUser1.recover(
        bidRequestHash,
        bidSignature
      );
      expect(recoveredAddress).to.eq(user1.address);
    });
  });

  describe("Places a bid", () => {
    it("emits a DomainBidPlaced event with the correct bid info", async () => {

      const bidRequestHash = await ethers.utils.keccak256(
        await ethers.utils.defaultAbiCoder.encode(
        ["uint256","string","uint256","string"],
        [bidAmount,name,parentID,bidIPFSHash]
      )
    );
      const bidSignature = await user1.signMessage(await ethers.utils.arrayify(bidRequestHash))

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

        const bidRequestHash = await ethers.utils.keccak256(
          await ethers.utils.defaultAbiCoder.encode(
          ["uint256","string","uint256","string"],
          [bidAmount,name,parentID,bidIPFSHash]
        )
      );

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
          const bidRequestHash = await ethers.utils.keccak256(
            await ethers.utils.defaultAbiCoder.encode(
            ["uint256","string","uint256","string"],
            [bidAmount,name,parentID,bidIPFSHash]
          )
        );
          const bidSignature = await user1.signMessage(await ethers.utils.arrayify(bidRequestHash))
          const lock = true;
          const returnedId = 3636;


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
