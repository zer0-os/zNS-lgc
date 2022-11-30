import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";
import {
  Registrar,
  ZNSHub__factory,
  Registrar__factory,
  ZNSHub,
  IOperatorFilterRegistry__factory,
  IOperatorFilterRegistry,
} from "../typechain";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { BigNumber, ContractTransaction } from "ethers";
import { calculateDomainHash, hashDomainName } from "./helpers";

chai.use(solidity);
const { expect } = chai;

describe("Registrar", () => {
  let accounts: SignerWithAddress[];
  let registryFactory: Registrar__factory;
  let registry: Registrar;
  let hubFactory: ZNSHub__factory;
  let hub: ZNSHub;
  const creatorAccountIndex = 0;
  let creator: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  const rootDomainHash = ethers.constants.HashZero;
  const rootDomainId = BigNumber.from(0);

  const deployRegistry = async (creator: SignerWithAddress) => {
    registryFactory = new Registrar__factory(creator);
    hubFactory = new ZNSHub__factory(creator);
    hub = await hubFactory.deploy();
    await hub.initialize(
      ethers.constants.AddressZero,
      ethers.constants.AddressZero
    );

    registry = await registryFactory.deploy();
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
    console.log("before");
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

      expect(tx).to.emit(hub, "EEDomainCreatedV3");
    });

    it("emits a DomainCreated event when a domain is registered with the expected params", async () => {
      await registry.connect(creator).addController(user1.address);
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
        .to.emit(hub, "EEDomainCreatedV3")
        .withArgs(
          registryAsUser1.address,
          expectedDomainHash,
          domainName,
          domainNameHash,
          rootDomainId,
          user2.address,
          user1.address,
          "",
          0,
          0,
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
      ).to.be.reverted;
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
        .to.emit(hub, "EEMetadataChanged")
        .withArgs(registry.address, testDomainId, newMetadataUri);
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
      ).to.be.reverted;
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
      ).to.be.reverted;
    });

    it("prevents a non-owner from locking metadata", async () => {
      const registryAsUser2 = registryAsUser1.connect(user2);

      await expect(
        registryAsUser2.lockDomainMetadata(testDomainId, true)
      ).to.be.reverted;
    });

    it("emits a MetadataLocked event when metadata is locked", async () => {
      const tx = await registryAsUser1.lockDomainMetadata(testDomainId, true);

      expect(tx)
        .to.emit(hub, "EEMetadataLockChanged")
        .withArgs(registry.address, testDomainId, user1.address, true);
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
      ).to.be.reverted;
    });

    it("prevents users other than the locker from unlocking metadata", async () => {
      const registryAsUser2 = registryAsUser1.connect(user2);

      await expect(
        registryAsUser2.lockDomainMetadata(testDomainId, false)
      ).to.be.reverted;
    });

    it("prevents metadata from being set if it is locked", async () => {
      await expect(
        registryAsUser1.setDomainMetadataUri(
          testDomainId,
          "https://www.chuckecheese.com/"
        )
      ).to.be.reverted;
    });

    it("emits a MetadataUnlocked event when metadata is unlocked", async () => {
      await expect(registryAsUser1.lockDomainMetadata(testDomainId, false))
        .to.emit(hub, "EEMetadataLockChanged")
        .withArgs(registry.address, testDomainId, user1.address, false);
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
        .to.emit(hub, "EERoyaltiesAmountChanged")
        .withArgs(registry.address, testDomainId, currentExpectedRoyaltyAmount);
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
      ).to.be.reverted;
    });
  });

  describe("Filter Operators", () => {
    let filterRegistry: IOperatorFilterRegistry;

    const blurAddress = "0x00000000000111AbE46ff893f3B2fdF1F759a8A8";
    let blurSigner: SignerWithAddress;

    beforeEach(async () => {
      await deployRegistry(creator);
      filterRegistry = IOperatorFilterRegistry__factory.connect(
        "0x000000000000AAeB6D7670E522A718067333cd4E",
        creator
      );
      blurSigner = await ethers.getImpersonatedSigner(blurAddress);
    });

    it("Already has the Registrar address in the filter", async () => {
      const isRegistered = await filterRegistry.isRegistered(registry.address);
      expect(isRegistered).to.be.true;
    });

    it("Is Able to transfer domains even if Registrar was not registered into filter registry", async () => {
      await filterRegistry.connect(creator).unregister(registry.address);
      await registry.connect(creator)["safeTransferFrom(address,address,uint256)"](
        creator.address,
        user1.address,
        rootDomainId
      );
      const domainOwner = await registry.ownerOf(rootDomainId);
      expect(domainOwner).to.be.eq(user1.address);
    });

    it("Unable to call to register with an existing registrant", async () => {
      await expect(filterRegistry.connect(creator).register(registry.address))
        .to.be.reverted;
    });

    it("Has filtered operators", async () => {
      const operators = await filterRegistry.filteredOperators(
        registry.address
      );
      expect(operators.length).to.be.gt(0);
    });
    it("Access to OpenSea list is shown by Blur already being filtered", async () => {
      // Reference: https://etherscan.io/address/0x00000000000111AbE46ff893f3B2fdF1F759a8A8#code
      const isOperatorFiltered = await filterRegistry.isOperatorFiltered(
        registry.address,
        blurAddress
      );
      expect(isOperatorFiltered).to.be.true;
    });
    it("Can't approve when on the filtered list", async () => {
      const tx = registry.connect(creator).approve(blurAddress, rootDomainId);
      await expect(tx).to.be.reverted;
    });
    it("Can approve when not on filtered list", async () => {
      const tx = registry.connect(creator).approve(user1.address, rootDomainId);
      await expect(tx).to.not.be.reverted;
    });
    it("Filtered addresses can't transfer domains", async () => {
      const registryLR = await registry.connect(blurSigner);
      await expect(
        registryLR["safeTransferFrom(address,address,uint256)"](
          creator.address,
          user1.address,
          rootDomainId
        )
      ).to.be.reverted;
    });
    it("Unfiltered addresses can transfer domains", async () => {
      const registryLR = await registry.connect(user1);
      await expect(
        registryLR["safeTransferFrom(address,address,uint256)"](
          creator.address,
          user1.address,
          rootDomainId
        )
      ).to.be.reverted;
    });
    it("Blur can transfer if the Registrar is unregistered from OpenSea's filter list.", async () => {
      await filterRegistry.unregister(registry.address);

      const approval = registry.connect(creator).approve(blurAddress, rootDomainId);
      await expect(approval).to.not.be.reverted;

      const transfer = registry.connect(blurSigner)["safeTransferFrom(address,address,uint256)"](
        creator.address,
        user1.address,
        rootDomainId
      );
      await expect(transfer).to.not.be.reverted;

    });
    it("Blur cannot transfer if the Registrar is registered to OpenSea's filter list.", async () => {
      // Registrar is registered by default with the filter list
      const isRegistered = await filterRegistry.isRegistered(registry.address);
      expect(isRegistered).to.be.true;

      const approval = registry.connect(creator).approve(blurAddress, rootDomainId);
      await expect(approval).to.be.reverted;

      const transfer = registry.connect(blurSigner)["safeTransferFrom(address,address,uint256)"](
        creator.address,
        user1.address,
        rootDomainId
      );
      await expect(transfer).to.be.reverted;
    })
  });
});
