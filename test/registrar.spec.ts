import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers, upgrades } from "hardhat";
import {
  Registrar,
  MainnetRegistrar,
  ZNSHub__factory,
  MainnetZNSHub__factory,
  Registrar__factory,
  MainnetRegistrar__factory,
  ZNSHub,
  MainnetZNSHub
} from "../typechain";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { BigNumber, ContractTransaction } from "ethers";
import { calculateDomainHash, hashDomainName } from "./helpers";
import * as smock from "@defi-wonderland/smock";

chai.use(solidity);
const { expect } = chai;

describe("Registrar", () => {
  let accounts: SignerWithAddress[];
  let registryFactory: Registrar__factory;
  let mainnetRegistryFactory: MainnetRegistrar__factory;
  let registry: Registrar;
  let mainnetRegistry: MainnetRegistrar;
  let hub: smock.FakeContract<ZNSHub>;
  let mainnetHub: smock.FakeContract<ZNSHub>;
  const creatorAccountIndex = 0;
  let creator: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  const rootDomainHash = ethers.constants.HashZero;
  const rootDomainId = BigNumber.from(0);

  const deployRegistry = async (creator: SignerWithAddress) => {
    registryFactory = new Registrar__factory(creator);
    hub = await smock.smock.fake(ZNSHub__factory);
    hub.owner.returns(creator.address);

    registry = await registryFactory.deploy();
    await registry.initialize(
      ethers.constants.AddressZero,
      ethers.constants.Zero,
      "Zer0 Name Service",
      "ZNS",
      hub.address
    );
  };

  const deployMainnetRegistry = async (creator: SignerWithAddress) => {
    mainnetRegistryFactory = new MainnetRegistrar__factory(creator);
    mainnetHub = await smock.smock.fake(MainnetZNSHub__factory);
    mainnetHub.owner.returns(creator.address);

    mainnetRegistry = await mainnetRegistryFactory.deploy();
    await mainnetRegistry.initialize(
      ethers.constants.AddressZero,
      ethers.constants.Zero,
      "Zer0 Name Service",
      "ZNS",
      mainnetHub.address
    );
  };

  const blurAddress = "0x00000000000111AbE46ff893f3B2fdF1F759a8A8";
  let blurSigner: SignerWithAddress;
  const looksrareAddress = "0xf42aa99F011A1fA7CDA90E5E98b277E306BcA83e";
  let looksrareSigner: SignerWithAddress;
  const looksrare1155Address = "0xFED24eC7E22f573c2e08AEF55aA6797Ca2b3A051";
  let looksrare1155Signer: SignerWithAddress;
  const sudoswapAddress = "0x2b2e8cda09bba9660dca5cb6233787738ad68329";
  let sudoswapSigner: SignerWithAddress;
  const customRevertErrorMessage =
    "VM Exception while processing transaction: reverted with custom error";

  before(async () => {
    console.log("before");
    accounts = await ethers.getSigners();
    creator = accounts[creatorAccountIndex];
    user1 = accounts[1];
    user2 = accounts[2];
    user3 = accounts[3];
    blurSigner = await ethers.getImpersonatedSigner(blurAddress);
    looksrareSigner = await ethers.getImpersonatedSigner(looksrareAddress);
    looksrare1155Signer = await ethers.getImpersonatedSigner(looksrare1155Address);
    sudoswapSigner = await ethers.getImpersonatedSigner(sudoswapAddress);
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
    //Mainnet registrar upgrade tests
    const registrarAddress = "0xc2e9678A71e50E5AEd036e00e9c5caeb1aC5987D";
    const hubAddress = "0x3F0d0a0051D1E600B3f6B35a07ae7A64eD1A10Ca";
    const deployerAddress = "0x7829Afa127494Ca8b4ceEF4fb81B78fEE9d0e471";
    var deployer: SignerWithAddress;

    it("Gets deployer", async () => {
      deployer = await ethers.getImpersonatedSigner(deployerAddress);
    });
    it("Upgrades registrar", async () => {
      //const mainnetRegistryFactory = await ethers.getContractFactory("MainnetRegistrar");
      //const mainnetRegistry = await mainnetRegistryFactory.deploy();
      await deployMainnetRegistry(creator);
      await upgrades.forceImport(
        mainnetRegistry.address,
        registryFactory
      );
    });
    it("Upgrades beacon proxy", async () => {
      const hub = ZNSHub__factory.connect(hubAddress, deployer);
      const beaconAddress = await hub.beacon();
      await upgrades.upgradeBeacon(
        beaconAddress,
        registryFactory
      );
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

  describe("approves and transfers", () => {
    before(async () => {
      await deployRegistry(creator);
    });
    it("approves user1", async () => {
      await registry.connect(creator).approve(user1.address, rootDomainId);
    });
    it("user1 transfers", async () => {
      const registryLR = await registry.connect(user1);
      await registryLR["safeTransferFrom(address,address,uint256)"](
        creator.address,
        user2.address,
        rootDomainId
      );
      const domainOwner = await registry.ownerOf(rootDomainId);
      expect(domainOwner).to.be.eq(user2.address);
    });

  });
  const customError = "VM Exception while processing transaction: reverted with an unrecognized custom error"
  describe("filters operators", () => {
    before(async () => {
      await deployRegistry(creator);
    });
    it("approves blur", async () => {
      await registry.connect(creator).approve(blurAddress, rootDomainId);
    });

    it("blur is unable to transfer", async () => {
      const registryLR = await registry.connect(blurSigner);
      const tx = registryLR["safeTransferFrom(address,address,uint256)"](
        creator.address,
        user3.address,
        rootDomainId
      );
      await expect(tx).to.be.revertedWith(customError); //With('OperatorNotAllowed').withArgs(blurAddress);
    });

    it("approves looksrare", async () => {
      await registry.connect(creator).approve(looksrareAddress, rootDomainId);
    });
    it("looksrare is unable to transfer", async () => {
      const registryLR = await registry.connect(looksrareSigner);
      const tx = registryLR["safeTransferFrom(address,address,uint256)"](
        creator.address,
        user3.address,
        rootDomainId
      );
      await expect(tx).to.be.revertedWith(customError)
    });

    it("approves looksrare1155", async () => {
      await registry.connect(creator).approve(looksrare1155Address, rootDomainId);
    });
    it("looksrare1155 is unable to transfer", async () => {
      const registryLR = await registry.connect(looksrare1155Signer);
      const tx = registryLR["safeTransferFrom(address,address,uint256)"](
        creator.address,
        user3.address,
        rootDomainId
      );
      await expect(tx).to.be.revertedWith(customError)
    });

    it("approves sudoswap", async () => {
      await registry.connect(creator).approve(sudoswapAddress, rootDomainId);
    });
    it("sudoswap is unable to transfer", async () => {
      const registryLR = await registry.connect(sudoswapSigner);
      const tx = registryLR["safeTransferFrom(address,address,uint256)"](
        creator.address,
        user3.address,
        rootDomainId
      );
      await expect(tx).to.be.revertedWith(customError)
    });
  });

  describe("controllers", () => {
    before(async () => {
      await deployRegistry(creator);
    });

    let addControllerTx: ContractTransaction;
    let removeControllerTx: ContractTransaction;

    it("adds controllers to the controller list", async () => {
      addControllerTx = await registry.addController(user1.address);
      expect(await registry.controllers(user1.address)).to.be.true;
    });

    it("emits a ControllerAdded event when a controller is added", async () => {
      expect(addControllerTx)
        .to.emit(registry, "ControllerAdded")
        .withArgs(user1.address);
    });

    it("removes controllers from the controller list", async () => {
      removeControllerTx = await registry.removeController(user1.address);
      expect(await registry.controllers(user1.address)).to.be.false;
    });

    it("emits a ControllerRemoved event when a controller is removed", async () => {
      expect(removeControllerTx)
        .to.emit(registry, "ControllerRemoved")
        .withArgs(user1.address);
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
          "",
          0,
          false
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
        "",
        0,
        false
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
        "",
        0,
        false
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
        "",
        0,
        false
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
          user1.address,
          "",
          0
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
        "",
        0,
        false
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
        "",
        0,
        false
      );

      const domainNameHash = hashDomainName(domainName);
      const expectedDomainHash = calculateDomainHash(
        rootDomainHash,
        domainNameHash
      );

      expect(await registryAsUser1.minterOf(expectedDomainHash)).to.eq(
        user3.address
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
        "",
        0,
        false
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
        "",
        0,
        false
      );

      const tx = registryAsUser1.registerDomain(
        rootDomainId,
        domainName,
        user3.address,
        "",
        0,
        false
      );

      await expect(tx).to.be.reverted;
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
          "",
          0,
          false
        )
      ).to.be.revertedWith("ZR: No parent");
    });

    it("allows a child domain to be registered on an existing domain", async () => {
      await registry.addController(user1.address);
      const registryAsUser1 = registry.connect(user1);

      const parentName = "myRoot";
      await registryAsUser1.registerDomain(
        rootDomainHash,
        parentName,
        user1.address,
        "",
        0,
        false
      );

      const parentHash = hashDomainName(parentName);
      const rootHash = calculateDomainHash(rootDomainHash, parentHash);
      const domainName = "myDomain";

      await registryAsUser1.registerDomain(
        rootHash,
        domainName,
        user1.address,
        "",
        0,
        false
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
        "",
        0,
        false
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
      ).to.be.revertedWith("ZR: Not owner");
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
        "",
        0,
        false
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
        registryAsUser1.lockDomainMetadata(testDomainId, false)
      ).to.be.revertedWith("ZR: Not locked");
    });

    it("prevents a non-owner from locking metadata", async () => {
      const registryAsUser2 = registryAsUser1.connect(user2);

      await expect(
        registryAsUser2.lockDomainMetadata(testDomainId, true)
      ).to.be.revertedWith("ZR: Not owner");
    });

    it("emits a MetadataLocked event when metadata is locked", async () => {
      const tx = await registryAsUser1.lockDomainMetadata(testDomainId, true);

      expect(tx)
        .to.emit(registryAsUser1, "MetadataLockChanged")
        .withArgs(testDomainId, user1.address, true);
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
        registryAsUser1.lockDomainMetadata(testDomainId, true)
      ).to.be.revertedWith("ZR: Metadata locked");
    });

    it("prevents users other than the locker from unlocking metadata", async () => {
      const registryAsUser2 = registryAsUser1.connect(user2);

      await expect(
        registryAsUser2.lockDomainMetadata(testDomainId, false)
      ).to.be.revertedWith("ZR: Not locker");
    });

    it("prevents metadata from being set if it is locked", async () => {
      await expect(
        registryAsUser1.setDomainMetadataUri(
          testDomainId,
          "https://www.chuckecheese.com/"
        )
      ).to.be.revertedWith("ZR: Metadata locked");
    });

    it("emits a MetadataUnlocked event when metadata is unlocked", async () => {
      await expect(registryAsUser1.lockDomainMetadata(testDomainId, false))
        .to.emit(registryAsUser1, "MetadataLockChanged")
        .withArgs(testDomainId, user1.address, false);
    });

    it("updates state of when metadata is unlocked", async () => {
      expect(await registryAsUser1.isDomainMetadataLocked(testDomainId)).to.be
        .false;
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
        "",
        0,
        false
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
      ).to.be.revertedWith("ZR: Not owner");
    });
  });
});
