import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers, upgrades } from "hardhat";
import {
  Registrar,
  ZNSHub,
  ZNSHub__factory,
  Registrar__factory,
} from "../typechain";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { BigNumber, ContractTransaction } from "ethers";
import {
  calculateDomainHash,
  domainNameToId,
  getEvent,
  hashDomainName,
} from "./helpers";
import * as smock from "@defi-wonderland/smock";
import { MockContract } from "@defi-wonderland/smock";

chai.use(solidity);
const { expect } = chai;

describe("Subdomain Registrar Functionality", () => {
  let accounts: SignerWithAddress[];
  let registryFactory: Registrar__factory;
  let registry: Registrar;
  let eventEmitter: smock.MockContract<ZNSHub>;
  const creatorAccountIndex = 0;
  let creator: SignerWithAddress;
  let user1: SignerWithAddress;
  const rootDomainHash = ethers.constants.HashZero;
  const rootDomainId = BigNumber.from(0);

  const deployRegistry = async (creator: SignerWithAddress) => {
    registryFactory = new Registrar__factory(creator);
    const emitterMockFactory = await smock.smock.mock<ZNSHub__factory>(
      "ZNSHub"
    );
    eventEmitter = await emitterMockFactory.deploy();
    await eventEmitter.initialize();

    const beacon = await upgrades.deployBeacon(registryFactory);

    registry = await registryFactory.deploy();
    await registry.initialize(
      ethers.constants.AddressZero,
      ethers.constants.Zero,
      "Zer0 Name Service",
      "ZNS",
      beacon.address,
      creator.address,
      eventEmitter.address
    );

    await eventEmitter.addRegistrar(rootDomainId, registry.address);
  };

  before(async () => {
    accounts = await ethers.getSigners();
    creator = accounts[creatorAccountIndex];
    user1 = accounts[1];
  });

  describe("Create", () => {
    before(async () => {
      await deployRegistry(creator);
      await registry.addController(creator.address);
    });

    let subdomainRegistrar: Registrar;
    let domainName = "foo";
    let domainId = domainNameToId(domainName);

    it("can create subdomain contracts", async () => {
      const tx = await registry.registerSubdomainContract(
        rootDomainId,
        domainName,
        creator.address,
        "somemetadata",
        0,
        true,
        creator.address
      );

      expect(tx).to.emit(eventEmitter, "EENewSubdomainRegistrar");
      const event = await getEvent(
        tx,
        "EENewSubdomainRegistrar",
        eventEmitter.address,
        eventEmitter.interface
      );
      console.log(tx.gasLimit.toString());
      subdomainRegistrar = Registrar__factory.connect(
        event.args["newRegistrar"],
        creator
      );
    });

    it("subdomain registrar returns proper owner", async () => {
      const ownerOnRoot = await registry.ownerOf(domainId);
      const ownerOnSub = await registry.ownerOf(domainId);

      expect(ownerOnRoot).to.eq(ownerOnSub);
    });

    it("prevents subdomains from being minted on root", async () => {
      const tx = registry.registerDomain(
        domainId,
        "bar",
        creator.address,
        "blahmetadata",
        0,
        true
      );

      await expect(tx).to.be.revertedWith("ZR: Parent is subcontract");
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
});
