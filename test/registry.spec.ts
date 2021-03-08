import { Registry } from "../typechain/Registry";
import { Registry__factory } from "../typechain/factories/Registry__factory";
import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { getSubnodeHash } from "./helpers";

describe("Registry", () => {
  let accounts: SignerWithAddress[];
  let registryFactory: Registry__factory;
  let registry: Registry;
  let creatorAccountIndex: number = 0;
  let creator: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  before(async () => {
    accounts = await ethers.getSigners();
    creator = accounts[creatorAccountIndex];
    user1 = accounts[1];
    user2 = accounts[2];
  });

  beforeEach("deploys", async () => {
    registryFactory = new Registry__factory(creator);
    registry = await registryFactory.deploy();
  });

  it("has owner", async () => {
    let contractOwner = await registry["owner()"]();
    expect(contractOwner).to.eq(creator.address);
  });

  it("root domain belongs to creator", async () => {
    expect(await registry["owner(bytes32)"](ethers.constants.HashZero)).to.eq(
      creator.address
    );
  });

  it("allows the contract owner to set subnode records", async () => {
    await registry.setSubnodeRecord(
      ethers.constants.HashZero,
      ethers.utils.id("test"),
      user1.address
    );
  });

  it("prevents non contract owners from setting subnode records", async () => {
    const registryAsUser1 = registry.connect(user1);

    const tx = registryAsUser1.setSubnodeRecord(
      ethers.constants.HashZero,
      ethers.utils.id("test"),
      user1.address
    );

    await expect(tx).to.be.reverted;
  });

  it("emits a NewOwner event when a subnode record is set", async () => {
    const rootNodeHash = ethers.constants.HashZero;
    const subnodeLabel = "test";
    const subnodeLabelHash = ethers.utils.id(subnodeLabel);

    const tx = await registry.setSubnodeRecord(
      rootNodeHash,
      subnodeLabelHash,
      user1.address
    );

    expect(tx)
      .to.emit(registry, "NewOwner")
      .withArgs(rootNodeHash, subnodeLabelHash, user1.address);
  });

  it("assigns ownership when setting a subnode record", async () => {
    const rootNodeHash = ethers.constants.HashZero;
    const subnodeLabel = "test";
    const subnodeLabelHash = ethers.utils.id(subnodeLabel);
    const expectedNodeHash = getSubnodeHash(rootNodeHash, subnodeLabelHash);

    await registry.setSubnodeRecord(
      rootNodeHash,
      subnodeLabelHash,
      user1.address
    );

    expect(await registry["owner(bytes32)"](expectedNodeHash)).to.eq(
      user1.address
    );
  });

  it("allows you to check if a node record exists", async () => {
    const rootNodeHash = ethers.constants.HashZero;
    const subnodeLabel = "test";
    const subnodeLabelHash = ethers.utils.id(subnodeLabel);
    const expectedNodeHash = getSubnodeHash(rootNodeHash, subnodeLabelHash);

    await registry.setSubnodeRecord(
      rootNodeHash,
      subnodeLabelHash,
      user1.address
    );

    expect(await registry.recordExists(expectedNodeHash)).to.eq(true);
  });

  it("allows you to check if a node record does not exist", async () => {
    const rootNodeHash = ethers.constants.HashZero;
    const subnodeLabel = "test";
    const subnodeLabelHash = ethers.utils.id(subnodeLabel);
    const expectedNodeHash = getSubnodeHash(rootNodeHash, subnodeLabelHash);

    expect(await registry.recordExists(expectedNodeHash)).to.eq(false);
  });

  it("allows a node owner to transfer their node to another owner", async () => {
    const rootNodeHash = ethers.constants.HashZero;
    const subnodeLabel = "test";
    const subnodeLabelHash = ethers.utils.id(subnodeLabel);
    const expectedNodeHash = getSubnodeHash(rootNodeHash, subnodeLabelHash);

    await registry.setSubnodeRecord(
      rootNodeHash,
      subnodeLabelHash,
      user1.address
    );

    const registryAsUser1 = registry.connect(user1);

    await registryAsUser1.setOwner(expectedNodeHash, user2.address);

    expect(await registry["owner(bytes32)"](expectedNodeHash)).to.eq(
      user2.address
    );
  });

  it("emits a Transfer event when a node owner to transfers their node", async () => {
    const rootNodeHash = ethers.constants.HashZero;
    const subnodeLabel = "test";
    const subnodeLabelHash = ethers.utils.id(subnodeLabel);
    const expectedNodeHash = getSubnodeHash(rootNodeHash, subnodeLabelHash);

    await registry.setSubnodeRecord(
      rootNodeHash,
      subnodeLabelHash,
      user1.address
    );

    const registryAsUser1 = registry.connect(user1);

    const tx = await registryAsUser1.setOwner(expectedNodeHash, user2.address);

    expect(tx)
      .to.emit(registry, "Transfer")
      .withArgs(expectedNodeHash, user2.address);
  });
});
