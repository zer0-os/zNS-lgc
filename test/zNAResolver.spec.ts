import {
  FakeContract,
  MockContract,
  MockContractFactory,
  smock,
} from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import chai, { expect } from "chai";
import { BigNumber, ContractTransaction } from "ethers";
import { ethers } from "hardhat";
import {
  IZNSHub,
  ZNAResolver,
  ZNAResolver__factory,
} from "../typechain";
import IZNSHubAbi from "../artifacts/contracts/interfaces/IZNSHub.sol/IZNSHub.json";
import { EventMappingType, getAllEvents } from "./helpers";
import { ResourceType } from "../typechain/ResourceType";
import { MockResourceRegistry } from "../typechain/MockResourceRegistry";
import { MockResourceRegistry__factory } from "../typechain/factories/MockResourceRegistry__factory";

chai.use(smock.matchers);

interface TxWithEventsType {
  tx: ContractTransaction;
  events: EventMappingType;
}

describe("zNAResolver", function () {
  let deployer: SignerWithAddress,
    resourceRegistryManager: SignerWithAddress,
    resourceRegistryManagerNot: SignerWithAddress,
    zNAOwner: SignerWithAddress,
    userA: SignerWithAddress;

  let resourceTypeLib: ResourceType,
    zNSHub: FakeContract<IZNSHub>,
    resourceDAORegistry: MockContract<MockResourceRegistry>,
    resourceStakingRegistry: MockContract<MockResourceRegistry>,
    resourceRegistryNot: MockContract<MockResourceRegistry>,
    zNAResolver: MockContract<ZNAResolver>;

  const wilder_beasts =
    BigNumber.from("0x290422f1f79e710c65e3a72fe8dddc0691bb638c865f5061a5e639cf244ee5ed");
  const fake_wilder_beasts =
    BigNumber.from("0x290422f1f79e710c65e3a72fe8dddc0691bb638c865f5061a5e639cf244effff");

  let RESOURCE_TYPE_DAO: BigNumber,
    RESOURCE_TYPE_STAKING_POOL: BigNumber,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    RESOURCE_TYPE_FARMING: BigNumber;

  let RESOURCE_TYPE_MANAGER_ROLE: string;

  const resourceID1 = BigNumber.from(1),
    resourceID2 = BigNumber.from(2),
    notExistingResourceID = BigNumber.from(100);

  beforeEach("init setup", async function () {
    [deployer,
    resourceRegistryManager, resourceRegistryManagerNot, zNAOwner, userA] =
      await ethers.getSigners();

    zNSHub = (await smock.fake<IZNSHub>(
      IZNSHubAbi.abi
    )) as FakeContract<IZNSHub>;

    // Deploy ResourceType Library
    const ResourceTypeLibFactory = await ethers.getContractFactory("ResourceType");
    resourceTypeLib = await ResourceTypeLibFactory.deploy() as ResourceType;

    // What is Resource Type
    RESOURCE_TYPE_DAO = await resourceTypeLib.RESOURCE_TYPE_DAO();
    RESOURCE_TYPE_STAKING_POOL = await resourceTypeLib.RESOURCE_TYPE_STAKING_POOL();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    RESOURCE_TYPE_FARMING = await resourceTypeLib.RESOURCE_TYPE_FARMING();

    // Deploy ZNAResolver
    const ZNAResolverFactory = (await smock.mock<ZNAResolver__factory>(
      "ZNAResolver"
    )) as MockContractFactory<ZNAResolver__factory>;
    zNAResolver =
      (await ZNAResolverFactory.deploy()) as MockContract<ZNAResolver>;
    await zNAResolver.initialize(zNSHub.address);

    // What is defined Role
    RESOURCE_TYPE_MANAGER_ROLE =
      await zNAResolver.RESOURCE_TYPE_MANAGER_ROLE();

    // Deploy MockResourceRegistry
    const MockResourceRegistryFactory = (await smock.mock<MockResourceRegistry__factory>(
      "MockResourceRegistry"
    )) as MockContractFactory<MockResourceRegistry__factory>;
    resourceDAORegistry = (await MockResourceRegistryFactory.deploy(RESOURCE_TYPE_DAO, zNAResolver.address)) as MockContract<MockResourceRegistry>;
    resourceStakingRegistry = (await MockResourceRegistryFactory.deploy(RESOURCE_TYPE_STAKING_POOL, zNAResolver.address)) as MockContract<MockResourceRegistry>;
    resourceRegistryNot = (await MockResourceRegistryFactory.deploy(RESOURCE_TYPE_DAO, zNAResolver.address)) as MockContract<MockResourceRegistry>;

    // Grant Roles
    await zNAResolver.setupResourceRegistryManagerRole(
      resourceRegistryManager.address
    );
    await zNAResolver.addResourceRegistry(RESOURCE_TYPE_DAO, resourceDAORegistry.address);
    await zNAResolver.addResourceRegistry(RESOURCE_TYPE_STAKING_POOL, resourceStakingRegistry.address);

    // Fake results
    zNSHub.ownerOf.whenCalledWith(wilder_beasts).returns(zNAOwner.address);
    zNSHub.domainExists.whenCalledWith(wilder_beasts).returns(true);
    zNSHub.domainExists.whenCalledWith(fake_wilder_beasts).returns(false);
    resourceDAORegistry.resourceExists.whenCalledWith(resourceID1).returns(true);
    resourceDAORegistry.resourceExists.whenCalledWith(resourceID2).returns(true);
    resourceDAORegistry.resourceExists.whenCalledWith(notExistingResourceID).returns(false);
    resourceStakingRegistry.resourceExists.whenCalledWith(resourceID1).returns(true);
    resourceStakingRegistry.resourceExists.whenCalledWith(resourceID2).returns(true);
    resourceStakingRegistry.resourceExists.whenCalledWith(notExistingResourceID).returns(false);
  });

  async function associateWithResourceType(resourceRegistry: MockContract<MockResourceRegistry>, zNA: BigNumber, resourceType: BigNumber, resourceID: BigNumber): Promise<TxWithEventsType> {
    const tx = await resourceRegistry.addResource(zNA);
    const events = await getAllEvents(tx, zNAResolver.address, zNAResolver.interface);
      
    expect(tx).to.emit(zNAResolver, "ResourceAssociated")
      .withArgs(zNA, resourceType, resourceID);

    const hasResourceType = await zNAResolver.hasResourceType(
      zNA,
      resourceType
    );
    expect(hasResourceType).to.be.equal(true);

    const resourceIDA = await zNAResolver.resourceID(
      zNA,
      resourceType
    );
    expect(resourceIDA).to.be.equal(resourceID);

    return {tx, events};
  }

  async function disassociateWithResourceType(zNAOwner: SignerWithAddress, zNA: BigNumber, resourceType: BigNumber): Promise<TxWithEventsType> {
    const resourceID = await zNAResolver.resourceID(
      zNA,
      resourceType
    );

    const tx = await zNAResolver.connect(zNAOwner)
      .disassociateWithResourceType(zNA, resourceType);
    const events = await getAllEvents(tx, zNAResolver.address, zNAResolver.interface);

    expect(tx).to.emit(zNAResolver, "ResourceDisassociated")
    .withArgs(zNA, resourceType, resourceID);

    const hasResourceType = await zNAResolver.hasResourceType(
      zNA,
      resourceType
    );
    expect(hasResourceType).to.be.equal(false);

    const resourceIDA = await zNAResolver.resourceID(
      zNA,
      resourceType
    );
    expect(resourceIDA).to.be.equal(BigNumber.from(0));

    return {tx, events};
  }

  async function addResourceRegistry(resourceRegistryManager: SignerWithAddress, resourceType: BigNumber, resourceDAORegistry: string): Promise<TxWithEventsType> {
    const tx = await zNAResolver.connect(resourceRegistryManager)
      .addResourceRegistry(resourceType, resourceDAORegistry);
    const events = await getAllEvents(tx, zNAResolver.address, zNAResolver.interface);

    expect(tx).to.emit(zNAResolver, "ResourceRegistryAdded")
      .withArgs(resourceType, resourceDAORegistry);
      
    const resourceRegistryA = await zNAResolver.resourceRegistry(
      resourceType
    );
    expect(resourceRegistryA).to.be.equal(resourceDAORegistry);

    return {tx, events};
  }

  async function removeResourceRegistry(resourceRegistryManager: SignerWithAddress, resourceType: BigNumber): Promise<TxWithEventsType> {
    const resourceDAORegistry = await zNAResolver.resourceRegistry(resourceType);

    const tx = await zNAResolver.connect(resourceRegistryManager)
      .removeResourceRegistry(resourceType);
    const events = await getAllEvents(tx, zNAResolver.address, zNAResolver.interface);

    expect(tx).to.emit(zNAResolver, "ResourceRegistryRemoved")
      .withArgs(resourceType, resourceDAORegistry);

    return {tx, events};
  }

  describe("Check for callable permission", async function () {
    it("Only admin can update zNSHub address", async function () {
      await expect(zNAResolver.connect(userA).setZNSHub(zNSHub.address)).to.be
        .reverted;

      await expect(zNAResolver.connect(deployer).setZNSHub(zNSHub.address)).to
        .be.not.reverted;
    });

    it("zNA owner can associate zNA with resource type", async function () {
      await expect(
        zNAResolver
          .connect(userA)
          .associateWithResourceType(
            wilder_beasts,
            RESOURCE_TYPE_DAO,
            resourceID1
          )
      ).to.be.revertedWith("Not authorized: resource type manager");

      await expect(
        zNAResolver
          .connect(userA)
          .disassociateWithResourceType(wilder_beasts, RESOURCE_TYPE_DAO)
      ).to.be.revertedWith("Not authorized: resource type manager");

      await expect(
        zNAResolver
          .connect(zNAOwner)
          .associateWithResourceType(
            wilder_beasts,
            RESOURCE_TYPE_DAO,
            resourceID1
          )
      ).to.be.not.reverted;
    });

    it("Resource Registry can associate with resource type", async function () {
      await expect(resourceRegistryNot.addResource(wilder_beasts)).to.be.revertedWith("Not authorized: resource type manager");

      await expect(resourceDAORegistry.addResource(wilder_beasts)).to.be.not.revertedWith;
    });

    it("Only resource registry manager can add resource registry", async function () {
      await expect(
        zNAResolver
          .connect(resourceRegistryManagerNot)
          .addResourceRegistry(RESOURCE_TYPE_DAO, resourceDAORegistry.address)
      ).to.be.revertedWith("Not authorized: resource registry manager");

      await expect(
        zNAResolver
          .connect(resourceRegistryManager)
          .addResourceRegistry(RESOURCE_TYPE_DAO, resourceDAORegistry.address)
      ).to.be.not.reverted;
    });
  });

  describe("Check for parameter validation", async function () {
    it("Should allow to use valid zNA", async function () {
      await expect(
        zNAResolver.connect(zNAOwner).associateWithResourceType(fake_wilder_beasts, RESOURCE_TYPE_DAO, resourceID1)
      ).to.be.revertedWith("Invalid zNA");
    });

    it("Should allow to use valid resource type", async function () {
      await expect(
        zNAResolver.connect(zNAOwner).associateWithResourceType(
          wilder_beasts, RESOURCE_TYPE_DAO.add(RESOURCE_TYPE_STAKING_POOL), resourceID1
        )
      ).to.be.revertedWith("Invalid resource type");

      await expect(
        zNAResolver.connect(resourceRegistryManager).addResourceRegistry(
          RESOURCE_TYPE_DAO.add(RESOURCE_TYPE_STAKING_POOL),
          resourceDAORegistry.address
        )
      ).to.be.revertedWith("Invalid resource type");
    });

    it("Should allow to use existing resource ID", async function () {
      await expect(
        zNAResolver.connect(zNAOwner).associateWithResourceType(
          wilder_beasts, RESOURCE_TYPE_DAO, notExistingResourceID
        )
      ).to.be.revertedWith("Not exist resource");
    });
  });

  describe("Check for resource registry", async function () {
    it("Should add resource registry", async function () {
      await expect(addResourceRegistry(
        resourceRegistryManager, 
        RESOURCE_TYPE_DAO,
        resourceDAORegistry.address
      )).to.be.not.reverted;
    });

    it("Should remove resource registry", async function () {
      await addResourceRegistry(
        resourceRegistryManager, 
        RESOURCE_TYPE_DAO,
        resourceDAORegistry.address
      );

      await expect(removeResourceRegistry(
        resourceRegistryManager,
        RESOURCE_TYPE_DAO
      )).to.be.not.reverted;
    });

    it("Should revoke old resource registry", async function () {
      // Add resource registry per DAO resource type
      await addResourceRegistry(resourceRegistryManager, RESOURCE_TYPE_DAO, resourceDAORegistry.address);

      // Add new resource registry per same resource type
      const {tx} = await addResourceRegistry(resourceRegistryManager, RESOURCE_TYPE_DAO, resourceStakingRegistry.address);
      
      expect(tx).to.emit(zNAResolver, "ResourceRegistryRemoved")
        .withArgs(RESOURCE_TYPE_DAO, resourceDAORegistry.address);

      // Old resource registry should lose role
      const hasResourceTypeRoleDAO = await zNAResolver.hasRole(RESOURCE_TYPE_MANAGER_ROLE, resourceDAORegistry.address);
      expect(hasResourceTypeRoleDAO).to.be.equal(false);

      // New resource registry should have new role
      const hasResourceTypeRoleStaking = await zNAResolver.hasRole(RESOURCE_TYPE_MANAGER_ROLE, resourceStakingRegistry.address);
      expect(hasResourceTypeRoleStaking).to.be.equal(true);
    });
  });

  describe("Check for association with resource type/ID", async function () {
    it("Should associate with valid zNA and resource type", async function () {
      await associateWithResourceType(resourceDAORegistry, wilder_beasts, RESOURCE_TYPE_DAO, resourceID1);

      await expect(resourceDAORegistry.addResourceExploit(wilder_beasts, RESOURCE_TYPE_STAKING_POOL)).to.be.revertedWith("Only allow to manage registered resource type");
    });

    it("zNA owner can associate/disassociate with different resource type", async function () {
      // Associate zNA with DAO resource type
      await associateWithResourceType(resourceDAORegistry, wilder_beasts, RESOURCE_TYPE_DAO, resourceID1);

      // Associate zNA with Staking resource type
      const {tx} = await associateWithResourceType(resourceStakingRegistry, wilder_beasts, RESOURCE_TYPE_STAKING_POOL, resourceID1);

      expect(tx).to.emit(zNAResolver, "ResourceDisassociated")
        .withArgs(wilder_beasts, RESOURCE_TYPE_DAO, resourceID1);

      // zNA should not have DAO association, only have Staking
      const hasDAOResourceType = await zNAResolver.hasResourceType(wilder_beasts, RESOURCE_TYPE_DAO);
      expect(hasDAOResourceType).to.be.equal(false);

      // Associate zNA with DAO resource type again
      const {tx: tx2} = await associateWithResourceType(resourceDAORegistry, wilder_beasts, RESOURCE_TYPE_DAO, resourceID2);
      
      expect(tx2).to.emit(zNAResolver, "ResourceDisassociated")
        .withArgs(wilder_beasts, RESOURCE_TYPE_STAKING_POOL, resourceID1);

      // zNA should only have DAO association
      const hasStakingResourceType2 = await zNAResolver.hasResourceType(wilder_beasts, RESOURCE_TYPE_STAKING_POOL);
      expect(hasStakingResourceType2).to.be.equal(false);

      // Disassociate DAO resource type
      await disassociateWithResourceType(zNAOwner, wilder_beasts, RESOURCE_TYPE_DAO);

      const hasDAOResourceType2 = await zNAResolver.hasResourceType(wilder_beasts, RESOURCE_TYPE_DAO);
      expect(hasDAOResourceType2).to.be.equal(false);
    });

    it("Resource Registry should only be able to associate/disassociate resources whose type it manages", async function () {
      // Resource Registry should be registered with DAO resource type
      // Let's assume that resource registry for DAO was already registered
      const resourceRegistry = await zNAResolver.resourceRegistry(RESOURCE_TYPE_DAO);
      expect(resourceRegistry).to.be.equal(resourceDAORegistry.address);

      // Associate zNA with DAO resource type
      // zNA should have DAO association
      await associateWithResourceType(resourceDAORegistry, wilder_beasts, RESOURCE_TYPE_DAO, resourceID1);

      // Associating zNA with Staking resource type should be reverted
      await expect(
        resourceDAORegistry.addResourceExploit(
          wilder_beasts, RESOURCE_TYPE_STAKING_POOL
        )
      ).to.be.revertedWith("Only allow to manage registered resource type");

      // Disassociating zNA from DAO resource type should not be reverted
      await expect(
        disassociateWithResourceType(zNAOwner, wilder_beasts, RESOURCE_TYPE_DAO)
      ).to.be.not.reverted;

    });

    it("zNA owner and Resource Registry can update resource ID with same resource type without disassociating", async function () {
      // Associate zNA with DAO resource type
      await associateWithResourceType(resourceDAORegistry, wilder_beasts, RESOURCE_TYPE_DAO, resourceID1);

      // Update resource ID with same resource type
      const {tx} = await associateWithResourceType(resourceDAORegistry, wilder_beasts, RESOURCE_TYPE_DAO, resourceID2);

      expect(tx).to.not.emit(zNAResolver, "ResourceDisassociated");

      const resourceIDA = await zNAResolver.resourceID(wilder_beasts, RESOURCE_TYPE_DAO);
      expect(resourceIDA).to.be.equal(resourceID2);

      // Associate zNA with DAO resource type by zNA owner
      const tx2 = await zNAResolver.connect(zNAOwner)
        .associateWithResourceType(wilder_beasts, RESOURCE_TYPE_STAKING_POOL, resourceID1);

      expect(tx2).to.emit(zNAResolver, "ResourceDisassociated")
        .withArgs(wilder_beasts, RESOURCE_TYPE_DAO, resourceID2);

      // Update resource ID with same resource type by zNA owner
      const tx3 = await zNAResolver.connect(zNAOwner)
        .associateWithResourceType(wilder_beasts, RESOURCE_TYPE_STAKING_POOL, resourceID2);

      expect(tx3).to.not.emit(zNAResolver, "ResourceDisassociated");

      const resourceIDB = await zNAResolver.resourceID(wilder_beasts, RESOURCE_TYPE_STAKING_POOL);
      expect(resourceIDB).to.be.equal(resourceID2);
    });
  });
});
