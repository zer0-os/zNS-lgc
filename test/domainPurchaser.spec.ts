import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import * as hre from "hardhat";

import chai from "chai";
import * as smock from "@defi-wonderland/smock";
import {
  DomainPurchaser,
  DomainPurchaser__factory,
  ERC20Upgradeable__factory,
  IERC20Upgradeable,
  Registrar,
  Registrar__factory,
  ZNSHub,
  ZNSHub__factory,
} from "../typechain";
import { BigNumber } from "ethers";

chai.use(smock.smock.matchers);
const { expect } = chai;

describe("DomainPurchaser", () => {
  let accounts: SignerWithAddress[];
  let registrar: smock.FakeContract<Registrar>;
  let hub: smock.FakeContract<ZNSHub>;
  let erc20Token: smock.FakeContract<IERC20Upgradeable>;
  let purchaser: DomainPurchaser;

  const creatorAccountIndex = 0;
  let creator: SignerWithAddress;
  let user1: SignerWithAddress;

  const pricingData = {
    short: 3,
    medium: 2,
    long: 1,
  };

  before(async () => {
    accounts = await hre.ethers.getSigners();
    creator = accounts[creatorAccountIndex];
    user1 = accounts[1];
  });

  describe("purchase network domain", () => {
    before(async () => {
      hub = await smock.smock.fake(ZNSHub__factory);
      registrar = await smock.smock.fake(Registrar__factory);
      erc20Token = await smock.smock.fake(ERC20Upgradeable__factory);

      const factory = new DomainPurchaser__factory(creator);
      purchaser = await factory.deploy();
      await purchaser.initialize(
        erc20Token.address,
        hub.address,
        creator.address,
        pricingData,
        0
      );
    });

    it("allows a user to purchase a network", async () => {
      hub.getRegistrarForDomain.returns(registrar.address);
      registrar.registerSubdomainContract.returns(1);

      erc20Token.transferFrom.returns(true);

      const tx = await purchaser
        .connect(user1)
        .purchaseSubdomain(0, "meowmeowmeow", "ipfs://Qm1");

      expect(tx)
        .to.emit(purchaser, "NetworkPurchased")
        .withArgs(1, user1.address);

      expect(registrar.registerSubdomainContract).to.have.been.calledWith(
        0,
        "meowmeowmeow",
        user1.address,
        "ipfs://Qm1",
        0,
        false,
        user1.address
      );
    });

    it("fails if the user doesn't have enough funds", async () => {
      hub.getRegistrarForDomain.returns(registrar.address);
      registrar.registerSubdomainContract.returns(1);

      erc20Token.transferFrom.reset();
      erc20Token.transferFrom.reverts();

      const tx = purchaser
        .connect(user1)
        .purchaseSubdomain(0, "👻👻👻", "ipfs://Qm1", { gasLimit: 3000000 });

      await expect(tx).to.be.revertedWith("SafeERC20: low-level call failed");
    });

    it("charges the user the right amount for short length network", async () => {
      hub.getRegistrarForDomain.returns(registrar.address);
      registrar.registerSubdomainContract.returns(1);

      erc20Token.transferFrom.reset();
      erc20Token.transferFrom.returns(true);

      await purchaser
        .connect(user1)
        .purchaseSubdomain(0, "👻👻👻", "ipfs://Qm1");

      expect(erc20Token.transferFrom).to.have.been.calledWith(
        user1.address,
        creator.address,
        pricingData.short
      );
    });

    it("charges the user the right amount for medium length network", async () => {
      hub.getRegistrarForDomain.returns(registrar.address);
      registrar.registerSubdomainContract.returns(1);

      erc20Token.transferFrom.reset();
      erc20Token.transferFrom.returns(true);

      await purchaser
        .connect(user1)
        .purchaseSubdomain(0, "黄埔炒蛋", "ipfs://Qm1");

      expect(erc20Token.transferFrom).to.have.been.calledWith(
        user1.address,
        creator.address,
        pricingData.medium
      );
    });

    it("charges the user the right amount for long length network", async () => {
      hub.getRegistrarForDomain.returns(registrar.address);
      registrar.registerSubdomainContract.returns(1);

      erc20Token.transferFrom.reset();
      erc20Token.transferFrom.returns(true);

      await purchaser
        .connect(user1)
        .purchaseSubdomain(0, "thisnameismeow", "ipfs://Qm1");

      expect(erc20Token.transferFrom).to.have.been.calledWith(
        user1.address,
        creator.address,
        pricingData.long
      );
    });

    it("does not allow a user to register a network whose name is over 32 characters", async () => {
      hub.getRegistrarForDomain.returns(registrar.address);
      registrar.registerSubdomainContract.returns(1);

      erc20Token.transferFrom.reset();
      erc20Token.transferFrom.returns(true);

      const tx = purchaser
        .connect(user1)
        .purchaseSubdomain(
          0,
          "THISNAMEISREALLYLONGONETWOTHREE!!",
          "ipfs://Qm1"
        );

      await expect(tx).to.be.revertedWith("DP: Name too long");
    });

    it("does not allow a user to register a network with an empty name", async () => {
      hub.getRegistrarForDomain.returns(registrar.address);
      registrar.registerSubdomainContract.returns(1);

      erc20Token.transferFrom.reset();
      erc20Token.transferFrom.returns(true);

      const tx = purchaser
        .connect(user1)
        .purchaseSubdomain(0, "", "ipfs://Qm1");

      await expect(tx).to.be.revertedWith("DP: Empty string");
    });
  });

  describe("utility", () => {
    before(async () => {
      hub = await smock.smock.fake(ZNSHub__factory);
      registrar = await smock.smock.fake(Registrar__factory);
      erc20Token = await smock.smock.fake(ERC20Upgradeable__factory);

      const factory = new DomainPurchaser__factory(creator);
      purchaser = await factory.deploy();
      await purchaser.initialize(
        erc20Token.address,
        hub.address,
        creator.address,
        pricingData,
        0
      );
    });

    it("allows the owner to set the platform fee", async () => {
      await purchaser.setPlatformFee(100);
      expect(await purchaser.platformFee()).to.eq(100);
    });

    it("prevents the owner to set the platform fee beyond 99.99%", async () => {
      const tx = purchaser.setPlatformFee(1000);
      await expect(tx).to.be.revertedWith("DP: Fee beyond 99.99%");
    });

    it("allows the owner to set the platform wallet", async () => {
      await purchaser.setPlatformWallet(user1.address);
      expect(await purchaser.platformWallet()).to.eq(user1.address);
    });

    it("allows an authorized user to set domain minting status", async () => {
      hub.ownerOf.whenCalledWith(BigNumber.from(1)).returns(user1.address);
      await purchaser.connect(user1).setDomainMintingStatus(1, true, true);
      const record = await purchaser.purchaseData(1);
      expect(record.subdomainMintingEnabled).to.be.true;
      expect(record.allowSubdomainsToMint).to.be.true;
    });

    it("allows an authorized user to set domain minting pricing", async () => {
      hub.ownerOf.whenCalledWith(2).returns(user1.address);
      await purchaser.connect(user1).setDomainPricing(
        2,
        {
          short: 100,
          medium: 10,
          long: 20,
        },
        true,
        false
      );

      const record = await purchaser.purchaseData(2);
      expect(record.subdomainMintingEnabled).to.be.true;
      expect(record.allowSubdomainsToMint).to.be.false;
      expect(record.prices.short).to.eq(100);
      expect(record.prices.medium).to.eq(10);
      expect(record.prices.long).to.eq(20);
    });
  });
});
