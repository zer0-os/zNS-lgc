import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";
import chai from "chai";

import { Registrar, ZNSHub } from "../typechain";

import { domainNameToId } from "./helpers";
import { deployZNS } from "./helpers/deploy";

const { expect } = chai;

describe("Folder groups functionality", () => {
  let accounts: SignerWithAddress[];
  let registrar: Registrar;
  let zNSHub: ZNSHub;
  let creator: SignerWithAddress;
  let controller: SignerWithAddress;

  before(async () => {
    accounts = await ethers.getSigners();
    creator = accounts[0];
    controller = accounts[1];
    ({ registrar, zNSHub } = await deployZNS(creator));
    await registrar.addController(controller.address);
  });

  it("runs", async () => {
    // Should be 0
    const numDomainGroups = await registrar.numDomainGroups();
    expect(numDomainGroups).to.eq(0);
  });
  it("create domain groups", async () => {
    const asController = registrar.connect(controller);

    // Test folders
    const uri1 = "ipfs://QmafuzfZ2doheWYL9tDLm2t39vZvtjfnPy1QyHX4HVawqN/";
    const uri2 = "ipfs://QmRrp9Hichv1jV1SxkSx8pqnhKhjHMpPZFKmtKi8C8pALQ/";
    await asController.createDomainGroup(uri1);
    await asController.createDomainGroup(uri2);

    const numDomainGroups = await registrar.numDomainGroups();
    expect(numDomainGroups).to.eq(2);
  });
  it("updates an existing domain group", async () => {
    const asController: Registrar = registrar.connect(controller);

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
    const asController = registrar.connect(controller);
    const controllerAddress = await controller.getAddress();

    const isController = await registrar.isController(controller.address);
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
    const tokenUri = await registrar.tokenURI(domainId);
    // token record
    const record = await registrar.records(domainId);
    // group that the token is in
    const domainGroup = await registrar.domainGroups(record.domainGroup);

    const uri = `${domainGroup}${record.domainGroupFileIndex}`;
    expect(tokenUri).to.eq(uri);
  });

  it("Updates a uri and confirm that a domain in that group is updated as well", async () => {
    // Id of 0://1
    const domainId = domainNameToId("1");
    const record = await registrar.records(domainId);

    const updatedUri = "ipfs://QmafuzfZ2doheWYL9tDLm2t39vZvtjfnPy1QyHX4HVawqN/";
    const asController: Registrar = registrar.connect(controller);
    await asController.updateDomainGroup(1, updatedUri);

    const tokenUri = await registrar.tokenURI(domainId);
    expect(tokenUri).to.eq(`${updatedUri}${record.domainGroupFileIndex}`);
  });
});
