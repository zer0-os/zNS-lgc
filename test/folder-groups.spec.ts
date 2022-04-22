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
import { BigNumber } from "ethers";
import * as smock from "@defi-wonderland/smock";

chai.use(solidity);
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
  });

  it("runs", async () => {
    // Should be 0
    const numDomainGroups = await registry.numDomainGroups();
    expect(numDomainGroups.eq("0"))
  });
  it("create domain groups", async () => {
    await registry.addController(controller.address);

    const asController = registry.connect(controller);

    // Test folders
    const uri1 = "QmafuzfZ2doheWYL9tDLm2t39vZvtjfnPy1QyHX4HVawqN";
    const uri2 = "QmRrp9Hichv1jV1SxkSx8pqnhKhjHMpPZFKmtKi8C8pALQ";
    await asController.createDomainGroup(uri1);
    await asController.createDomainGroup(uri2);

    const numDomainGroups = await registry.numDomainGroups();
    expect(numDomainGroups.eq("2"));
  });
  it("updates an existing domain group", async () => {
    const asController: Registrar = registry.connect(controller);

    // Test groups
    const uri = "QmafuzfZ2doheWYL9tDLm2t39vZvtjfnPy1QyHX4HVawqN";
    const uri2 = "QmRrp9Hichv1jV1SxkSx8pqnhKhjHMpPZFKmtKi8C8pALQ";

    let retrievedUri1 = await asController.domainGroups("1");
    expect(retrievedUri1 === uri);

    const retrievedUri2 = await asController.domainGroups("2");
    expect(retrievedUri2 === uri2);

    const updatedUri = "QmTfoSpX2JjLJrccCkAQ6Doh4Pwd47HxwKfSXmhW5j9ojM";
    await asController.updateDomainGroup("1", updatedUri);

    retrievedUri1 = await asController.domainGroups("1");
    expect(retrievedUri1 === updatedUri);
  });
  it("registers domains in a domain group", async () => {
    const asController = registry.connect(controller);
    const controllerAddress = await controller.getAddress()

    let params = {
      parentId: "0",
      groupId: "1",
      namingOffset: "0",
      startingIndex: "0",
      endingIndex: "3",
      minter: controllerAddress,
      royaltyAmount: "0",
      locked: false
    }

    // Create 0://0, 0://1, 0://2
    const tx = await asController.registerDomainInGroupBulk(
      params.parentId,
      params.groupId,
      params.namingOffset,
      params.startingIndex,
      params.endingIndex,
      params.minter,
      params.royaltyAmount,
      params.locked
    );
    const receipt = await tx.wait();

    // There are 2 logs for every domain created
    expect(receipt.logs.length === 6)
  });
  it("Gets a baseUri from a domain group", async () => {
    const updatedUri = "QmTfoSpX2JjLJrccCkAQ6Doh4Pwd47HxwKfSXmhW5j9ojM";

    const domainUri = await registry.domainGroups("1")
    expect(domainUri === updatedUri);

    // Root, 3 in group 1, and 2 in group 2
    const supply = await (await registry.totalSupply()).toNumber();
    expect(supply === 6)

    for (let i = 0; i < supply; i++) {
      const domainId = await registry.tokenByIndex(i);
      const domain = await registry.records(domainId);
      console.log(
        `domainId: ${domainId.toString()}
        \nparentId: ${domain.parentId.toString()}
        \ndomainGroup: ${domain.domainGroup.toString()}
        \ngroupIndex ${domain.domainGroupFileIndex.toString()}\n`
      );
    }
  });
});
