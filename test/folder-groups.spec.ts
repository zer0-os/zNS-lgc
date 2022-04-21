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
  let deployer: SignerWithAddress;
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
    deployer = accounts[0];
    controller = accounts[1];
    await deployRegistry(deployer);
  });

  it("runs", async () => {
    // Should be 0
    const numDomainGroups = await registry.numDomainGroups();
    expect(numDomainGroups.eq("0"))
  });
  it("creates a domain group", async () => {
    await registry.addController(controller.address);

    const asController = registry.connect(controller);

    // Test folders
    const uri1 = "ipfs://QmafuzfZ2doheWYL9tDLm2t39vZvtjfnPy1QyHX4HVawqN";
    const uri2 = "ipfs://QmRrp9Hichv1jV1SxkSx8pqnhKhjHMpPZFKmtKi8C8pALQ";
    await asController.createDomainGroup(uri1);
    await asController.createDomainGroup(uri2);

    const numDomainGroups = await registry.numDomainGroups();
    expect(numDomainGroups.eq("2"));
  });
  it("updates an existing domain group", async () => {
    const asController: Registrar = registry.connect(controller);

    // Test folders
    const uri = "ipfs://QmafuzfZ2doheWYL9tDLm2t39vZvtjfnPy1QyHX4HVawqN";
    const updatedUri = "ipfs://QmTfoSpX2JjLJrccCkAQ6Doh4Pwd47HxwKfSXmhW5j9ojM";
    const uri2 = "ipfs://QmRrp9Hichv1jV1SxkSx8pqnhKhjHMpPZFKmtKi8C8pALQ";

    let retrievedUri1 = await asController.domainGroups("1");
    expect(retrievedUri1 === uri);

    const retrievedUri2 = await asController.domainGroups("2");
    expect(retrievedUri2 === uri2);

    // Was private but never referred to by anything? make public
    await asController.updateDomainGroup(ethers.BigNumber.from("1"), updatedUri);

    retrievedUri1 = await asController.domainGroups("1");
    expect(retrievedUri1 === updatedUri);
  });
  it("registers domains in a domain group", async () => {
    const asController = registry.connect(controller);
    const controllerAddress = await controller.getAddress()

    let params = {
      parentId: ethers.BigNumber.from("0"),
      groupId: ethers.BigNumber.from("1"),
      namingOffset: ethers.BigNumber.from("0"),
      startingIndex: ethers.BigNumber.from("0"),
      endingIndex: ethers.BigNumber.from("5"),
      minter: controllerAddress,
      royaltyAmount: ethers.BigNumber.from("0"),
      locked: false
    }

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
    console.log(receipt.logs.length);

    // Mint in second group
    params.groupId = ethers.BigNumber.from("2");

    const tx2 = await asController.registerDomainInGroupBulk(
      params.parentId,
      params.groupId,
      params.namingOffset,
      params.startingIndex,
      params.endingIndex,
      params.minter,
      params.royaltyAmount,
      params.locked
    )
    const receipt2 = await tx2.wait();
    // There are 2 logs for every domain created
    console.log(receipt2.logs.length)

  });
  it("Gets a domain from a domain group", async () => {
    const updatedUri = "ipfs://QmTfoSpX2JjLJrccCkAQ6Doh4Pwd47HxwKfSXmhW5j9ojM";

    const domainUri = await registry.domainGroups("1")
    expect(domainUri === updatedUri);

    // Root and then 5 each for 2 groups = 11 total
    const supply = await (await registry.totalSupply()).toNumber();
    console.log(supply);

    for (let i = 0; i < supply; i++) {
      const domainId = await registry.tokenByIndex(i);
      const domain = await registry.records(domainId);
      console.log(
        `domainId: ${domainId.toString()}, domainGroup: ${domain.domainGroup.toString()}, groupIndex ${domain.domainGroupFileIndex.toString()}`
      );
    }
  });
  it("Transfers a domain", async () => {
    const supply = await (await registry.totalSupply()).toNumber();

    // Don't transfer the root
    const random = Math.floor(Math.random() * supply - 1) + 1;

    const domainId = await registry.tokenByIndex(random);

    const owner = await registry.ownerOf(domainId);
    const dummyAddress = "0xa74b2de2D65809C613010B3C8Dc653379a63C55b"

    await registry.setApprovalForAll(owner, true);

    await registry.connect(controller).transferFrom(
      await controller.getAddress(),
      dummyAddress,
      domainId
    );

    const ownerAfterTransfer = await registry.ownerOf(domainId);
    expect(ownerAfterTransfer === dummyAddress);
  });
});
