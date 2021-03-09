import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";
import { Registrar, Registrar__factory } from "../typechain";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { BigNumber } from "ethers";
import { calculateDomainHash, hashDomainName } from "./helpers";

chai.use(solidity);
const { expect } = chai;

describe("Registrar", () => {
  let accounts: SignerWithAddress[];
  let registryFactory: Registrar__factory;
  let registry: Registrar;
  let creatorAccountIndex: number = 0;
  let creator: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  const rootDomainHash = ethers.constants.HashZero;
  let rootDomainId = BigNumber.from(0);

  before(async () => {
    accounts = await ethers.getSigners();
    creator = accounts[creatorAccountIndex];
    user1 = accounts[1];
    user2 = accounts[2];
    user3 = accounts[3];
  });

  beforeEach("deploys", async () => {
    registryFactory = new Registrar__factory(creator);
    registry = await registryFactory.deploy();
  });

  it("has a root domain on creation", async () => {
    const doesRootExist = await registry.domainExists(rootDomainId);
    expect(doesRootExist).to.be.true;
  });

  it("creates the root domain belonging to the creator", async () => {
    const domainOwner = await registry.ownerOf(rootDomainId);
    expect(domainOwner).to.be.eq(
      creator.address,
      "The owner is not the creator."
    );
  });

  it("allows the contract owner to be transferred", async () => {
    await registry.transferOwnership(user1.address);
    expect(await registry.owner()).to.be.eq(user1.address);
  });

  it("allows for a domain to be transferred", async () => {
    await registry["safeTransferFrom(address,address,uint256)"](
      creator.address,
      user1.address,
      rootDomainId
    );
    const domainOwner = await registry.ownerOf(rootDomainId);
    expect(domainOwner).to.be.eq(user1.address);
  });

  it("adds controllers to the controller list", async () => {
    await registry.addController(user1.address);
    expect(await registry.controllers(user1.address)).to.be.true;
  });

  it("emits a ControllerAdded event when a controller is added", async () => {
    const tx = await registry.addController(user1.address);
    expect(tx).to.emit(registry, "ControllerAdded").withArgs(user1.address);
  });

  it("removes controllers from the controller list", async () => {
    await registry.addController(user1.address);
    await registry.removeController(user1.address);
    expect(await registry.controllers(user1.address)).to.be.false;
  });

  it("emits a ControllerRemoved event when a controller is removed", async () => {
    await registry.addController(user1.address);
    const tx = await registry.removeController(user1.address);
    expect(tx).to.emit(registry, "ControllerRemoved").withArgs(user1.address);
  });

  it("prevents non-owners from adding controllers", async () => {
    const registryAsUser1 = registry.connect(user1);
    await expect(registryAsUser1.addController(user1.address)).to.be.reverted;
  });

  it("prevents non controllers from registering domains", async () => {
    await expect(
      registry.registerDomain(rootDomainId, "myDomain", user2.address)
    ).to.be.reverted;
  });

  it("returns false if a domain doesn't exist", async () => {
    await registry.addController(user1.address);

    const domainName = "myDomain";
    const domainNameHash = hashDomainName(domainName);

    const expectedDomainHash = calculateDomainHash(
      rootDomainHash,
      domainNameHash
    );

    const doesDomainExist = await registry.domainExists(expectedDomainHash);
    expect(doesDomainExist).to.be.false;
  });

  it("allows controllers to register domains", async () => {
    await registry.addController(user1.address);
    const registryAsUser1 = registry.connect(user1);

    const domainName = "myDomain";
    const domainNameHash = hashDomainName(domainName);

    await registryAsUser1.registerDomain(
      rootDomainId,
      domainName,
      user2.address
    );

    const expectedDomainHash = calculateDomainHash(
      rootDomainHash,
      domainNameHash
    );

    const doesDomainExist = await registry.domainExists(expectedDomainHash);
    expect(doesDomainExist).to.be.true;
  });

  it("emits a DomainCreated event when a domain is registered", async () => {
    await registry.addController(user1.address);
    const registryAsUser1 = registry.connect(user1);

    const domainName = "myDomain";

    const tx = await registryAsUser1.registerDomain(
      rootDomainId,
      domainName,
      user2.address
    );

    expect(tx).to.emit(registry, "DomainCreated");
  });

  it("emits a DomainCreated event when a domain is registered with the expected params", async () => {
    await registry.addController(user1.address);
    const registryAsUser1 = registry.connect(user1);

    const domainName = "myDomain";

    const tx = await registryAsUser1.registerDomain(
      rootDomainId,
      domainName,
      user2.address
    );

    const domainNameHash = hashDomainName(domainName);
    const expectedDomainHash = calculateDomainHash(
      rootDomainHash,
      domainNameHash
    );
    const expectedParentHash = rootDomainHash;

    expect(tx)
      .to.emit(registry, "DomainCreated")
      .withArgs(
        expectedDomainHash,
        domainName,
        domainNameHash,
        expectedParentHash
      );
  });

  it("prevents a domain from being registered if it already exists", async () => {
    await registry.addController(user1.address);
    const registryAsUser1 = registry.connect(user1);

    const domainName = "myDomain";

    await registryAsUser1.registerDomain(
      rootDomainId,
      domainName,
      user2.address
    );

    const tx = registryAsUser1.registerDomain(
      rootDomainId,
      domainName,
      user3.address
    );

    await expect(tx).to.be.reverted;
  });

  it("returns that a registered domain is not available", async () => {
    await registry.addController(user1.address);
    const registryAsUser1 = registry.connect(user1);

    const domainName = "myDomain";

    await registryAsUser1.registerDomain(
      rootDomainId,
      domainName,
      user2.address
    );

    const domainNameHash = hashDomainName(domainName);
    const expectedDomainHash = calculateDomainHash(
      rootDomainHash,
      domainNameHash
    );

    expect(await registry.available(expectedDomainHash)).to.be.false;
  });

  it("returns that an unregistered domain is available", async () => {
    await registry.addController(user1.address);

    const domainName = "myDomain123";

    const domainNameHash = hashDomainName(domainName);
    const expectedDomainHash = calculateDomainHash(
      rootDomainHash,
      domainNameHash
    );

    expect(await registry.available(expectedDomainHash)).to.be.true;
  });

  it("prevents a domain from being registered if it's parent doesn't exist", async () => {
    await registry.addController(user1.address);
    const registryAsUser1 = registry.connect(user1);

    const parentName = "myRoot";
    const parentHash = hashDomainName(parentName);
    const rootHash = calculateDomainHash(rootDomainHash, parentHash);
    const domainName = "myDomain";

    await expect(
      registryAsUser1.registerDomain(rootHash, domainName, user2.address)
    ).to.be.revertedWith("No Parent");
  });

  it("allows a child domain to be regiseted on an existing domain", async () => {
    await registry.addController(user1.address);
    const registryAsUser1 = registry.connect(user1);

    const parentName = "myRoot";
    await registryAsUser1.registerDomain(
      rootDomainHash,
      parentName,
      user1.address
    );

    const parentHash = hashDomainName(parentName);
    const rootHash = calculateDomainHash(rootDomainHash, parentHash);
    const domainName = "myDomain";

    await registryAsUser1.registerDomain(rootHash, domainName, user1.address);

    const domainNameHash = hashDomainName(domainName);
    const expectedDomainHash = calculateDomainHash(rootHash, domainNameHash);
    expect(await registry.domainExists(expectedDomainHash)).to.be.true;
  });
});
