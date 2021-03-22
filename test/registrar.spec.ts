import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers, upgrades } from "hardhat";
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
  const creatorAccountIndex = 0;
  let creator: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  const rootDomainHash = ethers.constants.HashZero;
  const rootDomainId = BigNumber.from(0);

  const deployRegistry = async (creator: SignerWithAddress) => {
    registryFactory = new Registrar__factory(creator);
    registry = (await upgrades.deployProxy(registryFactory, [], {
      initializer: "initialize",
    })) as Registrar;
    registry = await registry.deployed();
  };

  before(async () => {
    accounts = await ethers.getSigners();
    creator = accounts[creatorAccountIndex];
    user1 = accounts[1];
    user2 = accounts[2];
    user3 = accounts[3];
  });

  describe("root domain", () => {
    before(async () => {
      await deployRegistry(creator);
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

    it("tracks the root domain controller as null", async () => {
      expect(await registry.domainController(rootDomainId)).to.eq(
        ethers.constants.AddressZero
      );
    });
  });

  describe("ownership", () => {
    it("allows the contract owner to be transferred", async () => {
      await registry["transferOwnership(address)"](user1.address);
      expect(await registry.owner()).to.be.eq(user1.address);
    });
  });

  describe("transferring domains", () => {
    before(async () => {
      await deployRegistry(creator);
    });

    // Redundant ERC721 test which is tested by OpenZeppelin
    it("prevents a user who does not own a domain from transferring it", async () => {
      const registryAsUser1 = registry.connect(user1);

      const tx = registryAsUser1["safeTransferFrom(address,address,uint256)"](
        creator.address,
        user1.address,
        rootDomainId
      );

      await expect(tx).to.be.revertedWith(
        "ERC721: transfer caller is not owner nor approved"
      );
    });

    it("allows for a domain to be transferred with 'safeTransferFrom'", async () => {
      await registry["safeTransferFrom(address,address,uint256)"](
        creator.address,
        user1.address,
        rootDomainId
      );
      const domainOwner = await registry.ownerOf(rootDomainId);
      expect(domainOwner).to.be.eq(user1.address);
    });
  });

  describe("controllers", () => {
    before(async () => {
      await deployRegistry(creator);
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
  });

  describe("registering domains", () => {
    beforeEach("deploys", async () => {
      await deployRegistry(creator);
    });

    it("prevents non controllers from registering domains", async () => {
      await expect(
        registry.registerDomain(
          rootDomainId,
          "myDomain",
          user2.address,
          user2.address
        )
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
        user2.address,
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
        user2.address,
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
        user2.address,
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
          expectedParentHash,
          user2.address,
          user1.address
        );
    });

    it("emits a Transfer event when a domain is registered (ERC721)", async () => {
      await registry.addController(user1.address);
      const registryAsUser1 = registry.connect(user1);

      const domainName = "myDomain";

      const tx = await registryAsUser1.registerDomain(
        rootDomainId,
        domainName,
        user2.address,
        user2.address
      );

      const domainNameHash = hashDomainName(domainName);
      const expectedDomainHash = calculateDomainHash(
        rootDomainHash,
        domainNameHash
      );

      expect(tx)
        .to.emit(registry, "Transfer")
        .withArgs(
          ethers.constants.AddressZero,
          user2.address,
          expectedDomainHash
        );
    });

    it("properly tracks who the creator of a domain was", async () => {
      await registry.addController(user1.address);
      const registryAsUser1 = registry.connect(user1);

      const domainName = "myDomain";

      await registryAsUser1.registerDomain(
        rootDomainId,
        domainName,
        user3.address,
        user2.address
      );

      const domainNameHash = hashDomainName(domainName);
      const expectedDomainHash = calculateDomainHash(
        rootDomainHash,
        domainNameHash
      );

      expect(await registryAsUser1.creatorOf(expectedDomainHash)).to.eq(
        user2.address
      );
    });

    it("properly tracks the controller that created a domain", async () => {
      await registry.addController(user1.address);
      const registryAsUser1 = registry.connect(user1);

      const domainName = "myDomain";

      await registryAsUser1.registerDomain(
        rootDomainId,
        domainName,
        user2.address,
        user2.address
      );

      const domainNameHash = hashDomainName(domainName);
      const expectedDomainHash = calculateDomainHash(
        rootDomainHash,
        domainNameHash
      );

      expect(await registryAsUser1.domainController(expectedDomainHash)).to.eq(
        user1.address
      );
    });

    it("prevents a domain from being registered if it already exists", async () => {
      await registry.addController(user1.address);
      const registryAsUser1 = registry.connect(user1);

      const domainName = "myDomain";

      await registryAsUser1.registerDomain(
        rootDomainId,
        domainName,
        user2.address,
        user2.address
      );

      const tx = registryAsUser1.registerDomain(
        rootDomainId,
        domainName,
        user3.address,
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
        user2.address,
        user2.address
      );

      const domainNameHash = hashDomainName(domainName);
      const expectedDomainHash = calculateDomainHash(
        rootDomainHash,
        domainNameHash
      );

      expect(await registry.isAvailable(expectedDomainHash)).to.be.false;
    });

    it("returns that an unregistered domain is available", async () => {
      await registry.addController(user1.address);

      const domainName = "myDomain123";

      const domainNameHash = hashDomainName(domainName);
      const expectedDomainHash = calculateDomainHash(
        rootDomainHash,
        domainNameHash
      );

      expect(await registry.isAvailable(expectedDomainHash)).to.be.true;
    });

    it("prevents a domain from being registered if it's parent doesn't exist", async () => {
      await registry.addController(user1.address);
      const registryAsUser1 = registry.connect(user1);

      const parentName = "myRoot";
      const parentHash = hashDomainName(parentName);
      const rootHash = calculateDomainHash(rootDomainHash, parentHash);
      const domainName = "myDomain";

      await expect(
        registryAsUser1.registerDomain(
          rootHash,
          domainName,
          user2.address,
          user2.address
        )
      ).to.be.revertedWith("No parent");
    });

    it("allows a child domain to be registered on an existing domain", async () => {
      await registry.addController(user1.address);
      const registryAsUser1 = registry.connect(user1);

      const parentName = "myRoot";
      await registryAsUser1.registerDomain(
        rootDomainHash,
        parentName,
        user1.address,
        user1.address
      );

      const parentHash = hashDomainName(parentName);
      const rootHash = calculateDomainHash(rootDomainHash, parentHash);
      const domainName = "myDomain";

      await registryAsUser1.registerDomain(
        rootHash,
        domainName,
        user1.address,
        user1.address
      );

      const domainNameHash = hashDomainName(domainName);
      const expectedDomainHash = calculateDomainHash(rootHash, domainNameHash);
      expect(await registry.domainExists(expectedDomainHash)).to.be.true;
    });
  });

  describe("domain metadata", () => {
    let registryAsUser1: Registrar;
    let testDomainId: string;
    let currentExpectedMetadataUri: string;

    before(async () => {
      await deployRegistry(creator);
    });

    before(async () => {
      await registry.addController(creator.address);

      const domainName = "myDomain";
      await registry.registerDomain(
        rootDomainId,
        domainName,
        user1.address,
        user1.address
      );

      const domainNameHash = hashDomainName(domainName);
      const expectedDomainHash = calculateDomainHash(
        rootDomainHash,
        domainNameHash
      );

      registryAsUser1 = registry.connect(user1);
      testDomainId = expectedDomainHash;
    });

    it("emits an event when a domain's metadata is changed", async () => {
      const newMetadataUri = "https://dorg.tech/";
      currentExpectedMetadataUri = newMetadataUri;
      await expect(
        registryAsUser1.setDomainMetadataUri(testDomainId, newMetadataUri)
      )
        .to.emit(registryAsUser1, "MetadataChanged")
        .withArgs(testDomainId, newMetadataUri);
    });

    it("updates state when metadata is changed", async () => {
      expect(await registryAsUser1.tokenURI(testDomainId)).to.eq(
        currentExpectedMetadataUri
      );
    });

    it("prevents a user who is not the owner of a domain from changing metadata", async () => {
      const registryAsUser2 = registryAsUser1.connect(user2);
      const newMetadataUri = "https://en.wikipedia.org/";

      await expect(
        registryAsUser2.setDomainMetadataUri(testDomainId, newMetadataUri)
      ).to.be.revertedWith("Not owner");
    });
  });

  describe("domain metadata locking", () => {
    let registryAsUser1: Registrar;
    let testDomainId: string;

    before(async () => {
      await deployRegistry(creator);
      await registry.addController(creator.address);

      const domainName = "myDomain";
      await registry.registerDomain(
        rootDomainId,
        domainName,
        user1.address,
        user1.address
      );

      const domainNameHash = hashDomainName(domainName);
      const expectedDomainHash = calculateDomainHash(
        rootDomainHash,
        domainNameHash
      );

      registryAsUser1 = registry.connect(user1);
      testDomainId = expectedDomainHash;
    });

    it("prevents unlocking when metadata is not locked", async () => {
      await expect(
        registryAsUser1.unlockDomainMetadata(testDomainId)
      ).to.be.revertedWith("Not locked");
    });

    it("prevents a non-owner from locking metadata", async () => {
      const registryAsUser2 = registryAsUser1.connect(user2);

      await expect(
        registryAsUser2.lockDomainMetadata(testDomainId)
      ).to.be.revertedWith("Not owner");
    });

    it("emits a MetadataLocked event when metadata is locked", async () => {
      const tx = await registryAsUser1.lockDomainMetadata(testDomainId);

      expect(tx)
        .to.emit(registryAsUser1, "MetadataLocked")
        .withArgs(testDomainId, user1.address);
    });

    it("updates state when the metadata is locked", async () => {
      expect(await registryAsUser1.isDomainMetadataLocked(testDomainId)).to.be
        .true;
    });

    it("updates state of who locked the metadata", async () => {
      expect(await registryAsUser1.domainMetadataLockedBy(testDomainId)).to.eq(
        user1.address
      );
    });

    it("prevents locking metadata if it is already locked", async () => {
      await expect(
        registryAsUser1.lockDomainMetadata(testDomainId)
      ).to.be.revertedWith("Metadata locked");
    });

    it("prevents users other than the locker from unlocking metadata", async () => {
      const registryAsUser2 = registryAsUser1.connect(user2);

      await expect(
        registryAsUser2.unlockDomainMetadata(testDomainId)
      ).to.be.revertedWith("Not locker");
    });

    it("prevents metadata from being set if it is locked", async () => {
      await expect(
        registryAsUser1.setDomainMetadataUri(
          testDomainId,
          "https://www.chuckecheese.com/"
        )
      ).to.be.revertedWith("Metadata locked");
    });

    it("emits a MetadataUnlocked event when metadata is unlocked", async () => {
      await expect(registryAsUser1.unlockDomainMetadata(testDomainId))
        .to.emit(registryAsUser1, "MetadataUnlocked")
        .withArgs(testDomainId);
    });

    it("updates state of when metadata is unlocked", async () => {
      expect(await registryAsUser1.isDomainMetadataLocked(testDomainId)).to.be
        .false;
    });

    it("prevents a non controller from locking metadata on behalf of a user", async () => {
      const tx = registryAsUser1.lockDomainMetadataForOwner(testDomainId);

      await expect(tx).to.be.revertedWith("Not controller");
    });

    it("allows a controller to lock metadata on behalf of a user", async () => {
      await registry.lockDomainMetadataForOwner(testDomainId);

      expect(await registry.isDomainMetadataLocked(testDomainId)).to.be.true;
    });

    it("records that the owner locked metadata if a controller does it", async () => {
      expect(await registry.domainMetadataLockedBy(testDomainId)).to.eq(
        user1.address
      );
    });

    it("prevents a controller from locking metadata if it is already locked", async () => {
      const tx = registry.lockDomainMetadataForOwner(testDomainId);

      await expect(tx).to.be.revertedWith("Metadata locked");
    });
  });

  describe("domain royalties", () => {
    let registryAsUser1: Registrar;
    let testDomainId: string;
    let currentExpectedRoyaltyAmount = 0;

    before(async () => {
      await deployRegistry(creator);
      await registry.addController(creator.address);

      const domainName = "myDomain";
      await registry.registerDomain(
        rootDomainId,
        domainName,
        user1.address,
        user2.address
      );

      const domainNameHash = hashDomainName(domainName);
      const expectedDomainHash = calculateDomainHash(
        rootDomainHash,
        domainNameHash
      );

      registryAsUser1 = registry.connect(user1);
      testDomainId = expectedDomainHash;
    });

    it("emits a RoyaltiesAmountChanged event when a domain's royalty amount changes", async () => {
      const royaltyAmount = 5 * 10 ** 5; // 5% (5 decimal places)
      currentExpectedRoyaltyAmount = royaltyAmount;

      const tx = await registryAsUser1.setDomainRoyaltyAmount(
        testDomainId,
        royaltyAmount
      );

      expect(tx)
        .to.emit(registryAsUser1, "RoyaltiesAmountChanged")
        .withArgs(testDomainId, currentExpectedRoyaltyAmount);
    });

    it("updates state when a domain's royalty amount changes", async () => {
      expect(await registryAsUser1.domainRoyaltyAmount(testDomainId)).to.eq(
        currentExpectedRoyaltyAmount
      );
    });

    it("prevents a user who is not the domain owner from setting the royalty amount", async () => {
      const registryAsUser2 = registryAsUser1.connect(user2);

      await expect(
        registryAsUser2.setDomainRoyaltyAmount(testDomainId, 0)
      ).to.be.revertedWith("Not owner");
    });
  });
});
