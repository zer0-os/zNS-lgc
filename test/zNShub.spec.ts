import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers, network } from "hardhat";
import {
  Registrar,
  Registrar__factory,
  ZNSHub,
} from "../typechain";
import chai from "chai";
import { domainNameToId, getEvent } from "./helpers";
import { BigNumber, BigNumberish } from "ethers";
import { deployZNS } from "../scripts/shared/deploy";

const { expect } = chai;

describe("zNS Hub", () => {
  let accounts: SignerWithAddress[];
  let registrar: Registrar;
  let zNSHub: ZNSHub;
  const creatorAccountIndex = 0;
  let creator: SignerWithAddress;
  let user1: SignerWithAddress;

  const rootDomainId = BigNumber.from(0);

  const createSubdomainContract = async (
    contract: Registrar,
    minter: SignerWithAddress,
    parentId: BigNumberish,
    label: string
  ) => {
    const tx = await contract.registerSubdomainContract(
      parentId,
      label,
      minter.address,
      "metadata",
      0,
      true,
      minter.address
    );
    const event = await getEvent(
      tx,
      "EENewSubdomainRegistrar",
      zNSHub.address,
      zNSHub.interface
    );
    return Registrar__factory.connect(
      event.args["childRegistrar"],
      contract.signer
    );
  };

  before(async () => {
    accounts = await ethers.getSigners();
    creator = accounts[creatorAccountIndex];
    user1 = accounts[1];
  });

  // describe("ownership", () => {
  //   before(async () => {
  //     const hubFactory = new ZNSHub__factory(creator);
  //     zNSHub = await hubFactory.deploy();
  //   });

  //   it("can transfer ownership", async () => {
  //     await zNSHub["transferOwnership"](user1.address);
  //     expect(await zNSHub.registrarBeacon()).to.eq(user1.address);
  //   });
  // });

  describe("Controllers", () => {
    before(async () => {
      //await deployRegistry(creator);
      await registrar.addController(creator.address);
    });

    describe("only allows owner to add controllers", async () => {
      const tx = zNSHub.connect(user1).addController(user1.address);
      await expect(tx).to.be.revertedWith("Ownable: caller is not the owner");
    });

    describe("only allows owner to remove controllers", async () => {
      const tx = zNSHub.connect(user1).removeController(user1.address);
      await expect(tx).to.be.revertedWith("Ownable: caller is not the owner");
    });

    describe("can add controller", async () => {
      await zNSHub.addController(creator.address);
      expect(await zNSHub.isController(creator.address)).to.to.true;
    });

    describe("can remove controller", async () => {
      await zNSHub.removeController(creator.address);
      expect(await zNSHub.isController(creator.address)).to.to.false;
    });
  });

  describe("Registrars", () => {
    before(async () => {
      //await deployRegistry(creator);
      await registrar.addController(creator.address);
    });
  });

  describe("Subdomain contract creation", () => {
    before(async () => {
      ({ registrar, zNSHub } = await deployZNS(network.name, creator));
      await registrar.addController(creator.address);
    });

    let subdomainRegistrar: Registrar;
    const domainName = "foo";
    const domainId = domainNameToId(domainName);

    it("can create subdomain contracts", async () => {
      const tx = await registrar.registerSubdomainContract(
        rootDomainId,
        domainName,
        creator.address,
        "somemetadata",
        0,
        true,
        creator.address
      );

      expect(tx).to.emit(zNSHub, "EENewSubdomainRegistrar");
      const event = await getEvent(
        tx,
        "EENewSubdomainRegistrar",
        zNSHub.address,
        zNSHub.interface
      );
      subdomainRegistrar = Registrar__factory.connect(
        event.args["childRegistrar"],
        creator
      );
    });

    it("subdomain registrar returns proper owner", async () => {
      const ownerOnRoot = await registrar.ownerOf(domainId);
      const ownerOnSub = await registrar.ownerOf(domainId);

      expect(ownerOnRoot).to.eq(ownerOnSub);
    });

    it("prevents subdomains from being minted on root", async () => {
      const tx = registrar.registerDomain(
        domainId,
        "bar",
        creator.address,
        "blahmetadata",
        0,
        true
      );

      await expect(tx).to.be.revertedWithCustomError(
        registrar,
        "SubdomainParent"
      );
    });

    it("allows root owner to add controller on subdomain contract", async () => {
      await subdomainRegistrar.addController(creator.address);
    });

    it("allows subdomains to be minted on subdomain contract", async () => {
      const tx = await subdomainRegistrar.registerDomain(
        domainId,
        "bar",
        creator.address,
        "metdata1",
        0,
        true
      );
    });
  });

  describe("ownerOf", () => {
    let subdomainRegistrar: Registrar;
    const domainName = "foo";
    const domainId = domainNameToId(domainName);
    before(async () => {
      ({ registrar, zNSHub } = await deployZNS(network.name, creator));
      await registrar.addController(creator.address);
    });

    it("ownerOf returns owner of root domain in subdomain contract", async () => {
      const childRegistrar = await createSubdomainContract(
        registrar,
        creator,
        0,
        "foo"
      );

      expect(await childRegistrar.ownerOf(0)).to.eq(await registrar.ownerOf(0));
    });
  });
});
