import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers, upgrades } from "hardhat";
import chai from "chai";
import { BigNumber } from "ethers";
import * as smock from "@defi-wonderland/smock";

import {
  Registrar,
  ZNSHub,
  ZNSHub__factory,
  Registrar__factory,
} from "../typechain";

import { domainNameToId } from "./helpers";

const { expect } = chai;

describe("Folder groups functionality", () => {
  let accounts: SignerWithAddress[];
  let registryFactory: Registrar__factory;
  let registry: Registrar;
  let hub: smock.MockContract<ZNSHub>;
  let creator: SignerWithAddress;
  let controller: SignerWithAddress;
  const rootDomainId = BigNumber.from(0);

  const deployRegistry = async (creator: SignerWithAddress) => {
    registryFactory = new Registrar__factory(creator);
    const emitterMockFactory = await smock.smock.mock<ZNSHub__factory>(
      "ZNSHub"
    );
    hub = await emitterMockFactory.deploy();

    const beacon = await upgrades.deployBeacon(registryFactory);

    registry = await registryFactory.deploy();

    await hub.initialize(registry.address, beacon.address);

    await registry.initialize(
      ethers.constants.AddressZero,
      ethers.constants.Zero,
      "Zer0 Name Service",
      "ZNS",
      hub.address
    );

    await hub.addRegistrar(rootDomainId, registry.address);
  };

  before(async () => {
    accounts = await ethers.getSigners();
    creator = accounts[0];
    controller = accounts[1];
    await deployRegistry(creator);
    await registry.addController(controller.address);
  });

  it("runs", async () => {
    // Should be 0
    const numDomainGroups = await registry.numDomainGroups();
    expect(numDomainGroups).to.eq(0);
  });
  it("create domain groups", async () => {
    const asController = registry.connect(controller);

    // Test folders
    const uri1 = "ipfs://QmafuzfZ2doheWYL9tDLm2t39vZvtjfnPy1QyHX4HVawqN/";
    const uri2 = "ipfs://QmRrp9Hichv1jV1SxkSx8pqnhKhjHMpPZFKmtKi8C8pALQ/";
    await asController.createDomainGroup(uri1);
    await asController.createDomainGroup(uri2);

    const numDomainGroups = await registry.numDomainGroups();
    expect(numDomainGroups).to.eq(2);
  });
  it("updates an existing domain group", async () => {
    const asController: Registrar = registry.connect(controller);

    // Test groups
    const uri = "ipfs://QmafuzfZ2doheWYL9tDLm2t39vZvtjfnPy1QyHX4HVawqN/";
    const uri2 = "ipfs://QmRrp9Hichv1jV1SxkSx8pqnhKhjHMpPZFKmtKi8C8pALQ/";

    let retrievedUri1 = await asController.domainGroups("1");
    expect(retrievedUri1).to.eq(uri);

    const retrievedUri2 = await asController.domainGroups("2");
    expect(retrievedUri2).to.eq(uri2);

    const updatedUri = "ipfs://QmTfoSpX2JjLJrccCkAQ6Doh4Pwd47HxwKfSXmhW5j9ojM/";
    await asController.updateDomainGroup("1", updatedUri);

    retrievedUri1 = await asController.domainGroups("1");
    expect(retrievedUri1).to.eq(updatedUri);
  });

  it("registers domains in a domain group", async () => {
    const asController = registry.connect(controller);
    const controllerAddress = await controller.getAddress();

    const isController = await registry.isController(controller.address);
    expect(isController).to.be.true;

    const params = {
      parentId: "0",
      groupId: "1",
      namingOffset: "0",
      startingIndex: "0",
      endingIndex: "3",
      minter: controllerAddress,
      royaltyAmount: "0",
    };

    // Create 0://0, 0://1, 0://2
    await asController.registerDomainInGroupBulk(
      params.parentId,
      params.groupId,
      params.namingOffset,
      params.startingIndex,
      params.endingIndex,
      params.minter,
      params.royaltyAmount,
      creator.address
    );

    expect(await asController.domainExists(domainNameToId("0"))).to.be.true;
    expect(await asController.domainExists(domainNameToId("1"))).to.be.true;
    expect(await asController.domainExists(domainNameToId("2"))).to.be.true;
  });

  it("has the proper token uri", async () => {
    const domainId = domainNameToId("1");
    // current token uri
    const tokenUri = await registry.tokenURI(domainId);
    // token record
    const record = await registry.records(domainId);
    // group that the token is in
    const domainGroup = await registry.domainGroups(record.domainGroup);

    const uri = `${domainGroup}${record.domainGroupFileIndex}`;
    expect(tokenUri).to.eq(uri);
  });

  it("Updates a uri and confirm that a domain in that group is updated as well", async () => {
    // Id of 0://1
    const domainId = domainNameToId("1");
    const record = await registry.records(domainId);

    const updatedUri = "ipfs://QmafuzfZ2doheWYL9tDLm2t39vZvtjfnPy1QyHX4HVawqN/";
    const asController: Registrar = registry.connect(controller);
    await asController.updateDomainGroup(1, updatedUri);

    const tokenUri = await registry.tokenURI(domainId);
    expect(tokenUri).to.eq(`${updatedUri}${record.domainGroupFileIndex}`);
  });
});
