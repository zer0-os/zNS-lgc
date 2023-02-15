import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers, network } from "hardhat";
import { Registrar, ZNSHub, OperatorFilterRegistry } from "../typechain";
import chai from "chai";
import { BigNumber, ContractTransaction } from "ethers";
import { calculateDomainHash, hashDomainName } from "./helpers";
import * as helpers from "@nomicfoundation/hardhat-network-helpers";
import { OperatorFilterRegistry__factory } from "../typechain/factories/OperatorFilterRegistry__factory";
import { deployZNS } from "../scripts/shared/deploy";

const { expect } = chai;

describe("Registrar", () => {
  let registrar: Registrar;
  let zNSHub: ZNSHub;
  let creator: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  const rootDomainHash = ethers.constants.HashZero;
  const rootDomainId = BigNumber.from(0);

  before(async () => {
    [creator] = await ethers.getSigners();
    user1 = await ethers.getImpersonatedSigner(
      "0xa74b2de2D65809C613010B3C8Dc653379a63C55b"
    );
    await helpers.setBalance(
      user1.address,
      ethers.utils.parseEther("10").toHexString()
    );
    user2 = await ethers.getImpersonatedSigner(
      "0x0f3b88095e750bdD54A25B2109c7b166A34B6dDb"
    );
    await helpers.setBalance(
      user2.address,
      ethers.utils.parseEther("10").toHexString()
    );
    user3 = await ethers.getImpersonatedSigner(
      "0xd5B840269Ac41E070aFF85554dF9aad406A4d091"
    );
    await helpers.setBalance(
      user3.address,
      ethers.utils.parseEther("10").toHexString()
    );
  });

  describe("root domain", () => {
    before(async () => {
      ({ registrar, zNSHub } = await deployZNS(network.name, creator));
    });

    it("has a root domain on creation", async () => {
      const doesRootExist = await registrar.domainExists(rootDomainId);
      expect(doesRootExist).to.be.true;
    });

    it("creates the root domain belonging to the creator", async () => {
      const domainOwner = await registrar.ownerOf(rootDomainId);
      expect(domainOwner).to.be.eq(
        creator.address,
        "The owner is not the creator."
      );
    });

    it("tracks the root domain controller as null", async () => {
      expect(await registrar.domainController(rootDomainId)).to.eq(
        ethers.constants.AddressZero
      );
    });
  });

  describe("transferring domains", () => {
    before(async () => {
      ({ registrar, zNSHub } = await deployZNS(network.name, creator));
    });

    // Redundant ERC721 test which is tested by OpenZeppelin
    it("prevents a user who does not own a domain from transferring it", async () => {
      const registryAsUser1 = registrar.connect(user1);

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
      await registrar["safeTransferFrom(address,address,uint256)"](
        creator.address,
        user1.address,
        rootDomainId
      );
      const domainOwner = await registrar.ownerOf(rootDomainId);
      expect(domainOwner).to.be.eq(user1.address);
    });
  });

  describe("controllers", () => {
    before(async () => {
      ({ registrar, zNSHub } = await deployZNS(network.name, creator));
    });

    let addControllerTx: ContractTransaction;
    let removeControllerTx: ContractTransaction;

    it("adds controllers to the controller list", async () => {
      addControllerTx = await registrar.addController(user1.address);
      expect(await registrar.controllers(user1.address)).to.be.true;
    });

    it("emits a ControllerAdded event when a controller is added", async () => {
      expect(addControllerTx)
        .to.emit(registrar, "ControllerAdded")
        .withArgs(user1.address);
    });

    it("removes controllers from the controller list", async () => {
      removeControllerTx = await registrar.removeController(user1.address);
      expect(await registrar.controllers(user1.address)).to.be.false;
    });

    it("emits a ControllerRemoved event when a controller is removed", async () => {
      expect(removeControllerTx)
        .to.emit(registrar, "ControllerRemoved")
        .withArgs(user1.address);
    });

    it("prevents non-owners from adding controllers", async () => {
      const registryAsUser1 = registrar.connect(user1);
      await expect(
        registryAsUser1.addController(user1.address)
      ).to.be.revertedWithCustomError(registrar, "NotAuthorized");
    });
  });

  describe("registering domains", () => {
    beforeEach("deploys", async () => {
      ({ registrar, zNSHub } = await deployZNS(network.name, creator));
    });

    it("prevents non controllers from registering domains", async () => {
      await expect(
        registrar.registerDomain(
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
      await registrar.addController(user1.address);

      const domainName = "myDomain";
      const domainNameHash = hashDomainName(domainName);

      const expectedDomainHash = calculateDomainHash(
        rootDomainHash,
        domainNameHash
      );

      const doesDomainExist = await registrar.domainExists(expectedDomainHash);
      expect(doesDomainExist).to.be.false;
    });

    it("allows controllers to register domains", async () => {
      await registrar.addController(user1.address);
      const registryAsUser1 = registrar.connect(user1);

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

      const doesDomainExist = await registrar.domainExists(expectedDomainHash);
      expect(doesDomainExist).to.be.true;
    });

    it("emits a DomainCreated event when a domain is registered", async () => {
      await registrar.addController(user1.address);
      const registryAsUser1 = registrar.connect(user1);

      const domainName = "myDomain";

      const tx = await registryAsUser1.registerDomain(
        rootDomainId,
        domainName,
        user2.address,
        "",
        0,
        false
      );

      expect(tx).to.emit(zNSHub, "EEDomainCreatedV3");
    });

    it("emits a DomainCreated event when a domain is registered with the expected params", async () => {
      await registrar.connect(creator).addController(user1.address);
      const registryAsUser1 = registrar.connect(user1);

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
        .to.emit(zNSHub, "EEDomainCreatedV3")
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
      await registrar.addController(user1.address);
      const registryAsUser1 = registrar.connect(user1);

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
        .to.emit(registrar, "Transfer")
        .withArgs(
          ethers.constants.AddressZero,
          user2.address,
          expectedDomainHash
        );
    });

    it("properly tracks who the creator of a domain was", async () => {
      await registrar.addController(user1.address);
      const registryAsUser1 = registrar.connect(user1);

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
      await registrar.addController(user1.address);
      const registryAsUser1 = registrar.connect(user1);

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
      await registrar.addController(user1.address);
      const registryAsUser1 = registrar.connect(user1);

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
      await registrar.addController(user1.address);
      const registryAsUser1 = registrar.connect(user1);

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
      ).to.be.revertedWithCustomError(registrar, "NoParentDomain");
    });

    it("allows a child domain to be registered on an existing domain", async () => {
      await registrar.addController(user1.address);
      const registryAsUser1 = registrar.connect(user1);

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
      expect(await registrar.domainExists(expectedDomainHash)).to.be.true;
    });
  });

  describe("domain metadata", () => {
    let registryAsUser1: Registrar;
    let testDomainId: string;
    let currentExpectedMetadataUri: string;

    before(async () => {
      ({ registrar, zNSHub } = await deployZNS(network.name, creator));
    });

    before(async () => {
      await registrar.addController(creator.address);

      const domainName = "myDomain";
      await registrar.registerDomain(
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

      registryAsUser1 = registrar.connect(user1);
      testDomainId = expectedDomainHash;
    });

    it("emits an event when a domain's metadata is changed", async () => {
      const newMetadataUri = "https://dorg.tech/";
      currentExpectedMetadataUri = newMetadataUri;
      await expect(
        registryAsUser1.setDomainMetadataUri(testDomainId, newMetadataUri)
      )
        .to.emit(zNSHub, "EEMetadataChanged")
        .withArgs(registrar.address, testDomainId, newMetadataUri);
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
      ).to.be.revertedWithCustomError(registrar, "NotDomainOwner");
    });
  });

  describe("domain metadata locking", () => {
    let registryAsUser1: Registrar;
    let testDomainId: string;

    before(async () => {
      ({ registrar, zNSHub } = await deployZNS(network.name, creator));
      await registrar.addController(creator.address);

      const domainName = "myDomain";
      await registrar.registerDomain(
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

      registryAsUser1 = registrar.connect(user1);
      testDomainId = expectedDomainHash;
    });

    it("prevents unlocking when metadata is not locked", async () => {
      await expect(
        registryAsUser1.lockDomainMetadata(testDomainId, false)
      ).to.be.revertedWithCustomError(registrar, "NotLockedMetadata");
    });

    it("prevents a non-owner from locking metadata", async () => {
      const registryAsUser2 = registryAsUser1.connect(user2);

      await expect(
        registryAsUser2.lockDomainMetadata(testDomainId, true)
      ).to.be.revertedWithCustomError(registrar, "NotDomainOwner");
    });

    it("emits a MetadataLocked event when metadata is locked", async () => {
      const tx = await registryAsUser1.lockDomainMetadata(testDomainId, true);

      expect(tx)
        .to.emit(zNSHub, "EEMetadataLockChanged")
        .withArgs(registrar.address, testDomainId, user1.address, true);
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
      ).to.be.revertedWithCustomError(registrar, "LockedMetadata");
    });

    it("prevents users other than the locker from unlocking metadata", async () => {
      const registryAsUser2 = registryAsUser1.connect(user2);

      await expect(
        registryAsUser2.lockDomainMetadata(testDomainId, false)
      ).to.be.revertedWithCustomError(registrar, "NotMetadataLocker");
    });

    it("prevents metadata from being set if it is locked", async () => {
      await expect(
        registryAsUser1.setDomainMetadataUri(
          testDomainId,
          "https://www.chuckecheese.com/"
        )
      ).to.be.revertedWithCustomError(registrar, "LockedMetadata");
    });

    it("emits a MetadataUnlocked event when metadata is unlocked", async () => {
      await expect(registryAsUser1.lockDomainMetadata(testDomainId, false))
        .to.emit(zNSHub, "EEMetadataLockChanged")
        .withArgs(registrar.address, testDomainId, user1.address, false);
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
      ({ registrar, zNSHub } = await deployZNS(network.name, creator));
      await registrar.addController(creator.address);

      const domainName = "myDomain";
      await registrar.registerDomain(
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

      registryAsUser1 = registrar.connect(user1);
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
        .to.emit(zNSHub, "EERoyaltiesAmountChanged")
        .withArgs(
          registrar.address,
          testDomainId,
          currentExpectedRoyaltyAmount
        );
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
      ).to.be.revertedWithCustomError(registrar, "NotDomainOwner");
    });
  });

  describe("Filter Operators", () => {
    let filterRegistry: OperatorFilterRegistry;

    const blurAddress = "0x00000000000111AbE46ff893f3B2fdF1F759a8A8";
    let blurSigner: SignerWithAddress;

    const subscriptionOrRegistrantToCopy =
      "0x3cc6CddA760b79bAfa08dF41ECFA224f810dCeB6";

    beforeEach(async () => {
      ({ registrar, zNSHub } = await deployZNS(network.name, creator));
      filterRegistry = OperatorFilterRegistry__factory.connect(
        "0x000000000000AAeB6D7670E522A718067333cd4E",
        creator
      );
      blurSigner = await ethers.getImpersonatedSigner(blurAddress);
      await helpers.setBalance(
        blurSigner.address,
        ethers.utils.parseEther("10").toHexString()
      );
    });

    it("Already has the Registrar address in the filter", async () => {
      const isRegistered = await filterRegistry.isRegistered(registrar.address);
      expect(isRegistered).to.be.true;
    });

    it("Is Able to transfer domains even if Registrar was not registered into filter registrar", async () => {
      await filterRegistry.connect(creator).unregister(registrar.address);
      // make sure successfully unregistered
      const isRegistered = await filterRegistry.isRegistered(registrar.address);
      expect(isRegistered).to.be.false;

      await registrar.connect(creator)[
        // eslint-disable-next-line no-unexpected-multiline
        "safeTransferFrom(address,address,uint256)"
      ](creator.address, user1.address, rootDomainId);
      const domainOwner = await registrar.ownerOf(rootDomainId);
      expect(domainOwner).to.be.eq(user1.address);
    });

    it("Unable to call to register with an existing registrant", async () => {
      await expect(
        filterRegistry.connect(creator).register(registrar.address)
      ).to.be.revertedWithCustomError(filterRegistry, "AlreadyRegistered");
    });

    it("Has filtered operators", async () => {
      const operators = await filterRegistry.filteredOperators(
        registrar.address
      );
      expect(operators.length).to.be.gt(0);
    });

    it("Access to OpenSea list is shown by Blur already being filtered", async () => {
      // Reference: https://etherscan.io/address/0x00000000000111AbE46ff893f3B2fdF1F759a8A8#code
      const isOperatorFiltered = await filterRegistry.isOperatorFiltered(
        registrar.address,
        blurAddress
      );
      expect(isOperatorFiltered).to.be.true;
    });

    it("Can't approve when on the filtered list", async () => {
      const isRegistered = await filterRegistry.isRegistered(registrar.address);
      expect(isRegistered).to.be.true;

      const tx = registrar.connect(creator).approve(blurAddress, rootDomainId);
      await expect(tx).to.be.revertedWithCustomError(
        filterRegistry,
        "AddressFiltered"
      );
    });

    it("Can approve when not on filtered list", async () => {
      const tx = registrar
        .connect(creator)
        .approve(user1.address, rootDomainId);
      await expect(tx).to.not.be.reverted;
    });

    it("Filtered addresses can't transfer domains", async () => {
      // Unregister registrant to approve blur for root domain
      await filterRegistry.connect(creator).unregister(registrar.address);
      await expect(
        registrar.connect(creator).approve(blurAddress, rootDomainId)
      ).to.be.not.reverted;

      // Register and subscribe again
      await filterRegistry
        .connect(creator)
        .registerAndSubscribe(
          registrar.address,
          subscriptionOrRegistrantToCopy
        );
      // Ensure if blur was already filtered
      const isBlurFiltered = await filterRegistry.isOperatorFiltered(
        registrar.address,
        blurAddress
      );
      expect(isBlurFiltered).to.be.true;

      const registryLR = await registrar.connect(blurSigner);
      await expect(
        registryLR["safeTransferFrom(address,address,uint256)"](
          creator.address,
          user1.address,
          rootDomainId
        )
      ).to.be.revertedWithCustomError(filterRegistry, "AddressFiltered");
    });

    it("Unfiltered addresses can transfer domains", async () => {
      const isUserFiltered = await filterRegistry.isOperatorFiltered(
        registrar.address,
        creator.address
      );
      expect(isUserFiltered).to.be.false;

      const registryLR = registrar.connect(creator);

      await expect(
        registryLR["safeTransferFrom(address,address,uint256)"](
          creator.address,
          user1.address,
          rootDomainId
        )
      ).to.not.be.reverted;
    });

    it("Blur can transfer if the Registrar is unregistered from OpenSea's filter list.", async () => {
      await filterRegistry.unregister(registrar.address);

      const approval = registrar
        .connect(creator)
        .approve(blurAddress, rootDomainId);
      await expect(approval).to.not.be.reverted;

      const transfer = registrar.connect(blurSigner)[
        // eslint-disable-next-line no-unexpected-multiline
        "safeTransferFrom(address,address,uint256)"
      ](creator.address, user1.address, rootDomainId);
      await expect(transfer).to.not.be.reverted;
    });

    it("Blur can transfer even if the Registrar is registered to OpenSea's filter list.", async () => {
      // Unregister registrant to approve blur for root domain
      await filterRegistry.connect(creator).unregister(registrar.address);
      await expect(
        registrar.connect(creator).approve(blurAddress, rootDomainId)
      ).to.be.not.reverted;

      // Register and subscribe again
      await filterRegistry.connect(creator).register(registrar.address);
      // Registrar is registered with the filter list
      const isRegistered = await filterRegistry.isRegistered(registrar.address);
      expect(isRegistered).to.be.true;

      const registryLR = registrar.connect(blurSigner);
      await expect(
        registryLR["safeTransferFrom(address,address,uint256)"](
          creator.address,
          user1.address,
          rootDomainId
        )
      ).to.be.not.reverted;
    });
  });
});
