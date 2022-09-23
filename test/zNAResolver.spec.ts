import {
  FakeContract,
  MockContract,
  MockContractFactory,
  smock,
} from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import chai, { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import {
  IResourceRegistry,
  IZNSHub,
  ZNAResolver,
  ZNAResolver__factory,
} from "../typechain";
import IZNSHubAbi from "../artifacts/contracts/interfaces/IZNSHub.sol/IZNSHub.json";
import IResourceRegistryAbi from "../artifacts/contracts/interfaces/IResourceRegistry.sol/IResourceRegistry.json";

chai.use(smock.matchers);

describe("zNAResolver", function () {
  let deployer: SignerWithAddress,
    resourceTypeManager: SignerWithAddress,
    resourceRegistryManager: SignerWithAddress,
    zNAOwner: SignerWithAddress,
    userA: SignerWithAddress;

  let zNSHub: FakeContract<IZNSHub>,
    resourceRegistry: FakeContract<IResourceRegistry>,
    zNAResolver: MockContract<ZNAResolver>;

  const wilder_beasts =
    "0x290422f1f79e710c65e3a72fe8dddc0691bb638c865f5061a5e639cf244ee5ed";

  let RESOURCE_TYPE_DAO: BigNumber,
    RESOURCE_TYPE_STAKING_POOL: BigNumber,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    RESOURCE_TYPE_FARMING: BigNumber;

  const resourceID1 = 1,
    resourceID2 = 2;

  beforeEach("init setup", async function () {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    [deployer, resourceTypeManager, resourceRegistryManager, zNAOwner, userA] =
      await ethers.getSigners();

    zNSHub = (await smock.fake<IZNSHub>(
      IZNSHubAbi.abi
    )) as FakeContract<IZNSHub>;

    resourceRegistry = (await smock.fake(
      IResourceRegistryAbi.abi
    )) as FakeContract<IResourceRegistry>;

    const ZNAResolverFactory = (await smock.mock<ZNAResolver__factory>(
      "ZNAResolver"
    )) as MockContractFactory<ZNAResolver__factory>;
    zNAResolver =
      (await ZNAResolverFactory.deploy()) as MockContract<ZNAResolver>;
    await zNAResolver.__ZNAResolver_init(zNSHub.address);

    RESOURCE_TYPE_DAO = await zNAResolver.RESOURCE_TYPE_DAO();
    RESOURCE_TYPE_STAKING_POOL = await zNAResolver.RESOURCE_TYPE_STAKING_POOL();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    RESOURCE_TYPE_FARMING = await zNAResolver.RESOURCE_TYPE_FARMING();

    const RESOURCE_TYPE_MANAGER_ROLE =
      await zNAResolver.RESOURCE_TYPE_MANAGER_ROLE();
    const RESOURCE_REGISTRY_MANAGER_ROLE =
      await zNAResolver.RESOURCE_REGISTRY_MANAGER_ROLE();
    await zNAResolver.grantRole(
      RESOURCE_TYPE_MANAGER_ROLE,
      resourceTypeManager.address
    );
    await zNAResolver.grantRole(
      RESOURCE_REGISTRY_MANAGER_ROLE,
      resourceRegistryManager.address
    );

    zNSHub.ownerOf.whenCalledWith(wilder_beasts).returns(zNAOwner.address);
    resourceRegistry.resourceExists.whenCalledWith(resourceID1).returns(true);
    resourceRegistry.resourceExists.whenCalledWith(resourceID2).returns(true);
  });

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
    });

    it("Only resource registry manager can add resource registry", async function () {
      await expect(
        zNAResolver
          .connect(userA)
          .addResourceRegistry(RESOURCE_TYPE_DAO, resourceRegistry.address)
      ).to.be.revertedWith("Not authorized: resource registry manager");

      await expect(
        zNAResolver
          .connect(resourceRegistryManager)
          .addResourceRegistry(RESOURCE_TYPE_DAO, resourceRegistry.address)
      ).to.be.not.reverted;
    });
  });

  describe("Check for resource registry", async function () {
    it("Should add resource registry", async function () {
      await zNAResolver
        .connect(resourceRegistryManager)
        .addResourceRegistry(RESOURCE_TYPE_DAO, resourceRegistry.address);

      const resourceRegistryA = await zNAResolver.resourceRegistry(
        RESOURCE_TYPE_DAO
      );
      expect(resourceRegistryA).to.be.equal(resourceRegistry.address);
    });
  });

  describe("Check for association with resource type", async function () {
    beforeEach(async function () {
      await zNAResolver
        .connect(resourceRegistryManager)
        .addResourceRegistry(RESOURCE_TYPE_DAO, resourceRegistry.address);
      await zNAResolver
        .connect(resourceRegistryManager)
        .addResourceRegistry(
          RESOURCE_TYPE_STAKING_POOL,
          resourceRegistry.address
        );
    });

    it("Should associate with valid zNA and resource type", async function () {
      await zNAResolver
        .connect(resourceTypeManager)
        .associateWithResourceType(
          wilder_beasts,
          RESOURCE_TYPE_DAO,
          resourceID1
        );

      const hasResourceType = await zNAResolver.hasResourceType(
        wilder_beasts,
        RESOURCE_TYPE_DAO
      );
      expect(hasResourceType).to.be.equal(true);

      const resourceTypes = await zNAResolver.resourceTypes(wilder_beasts);
      expect(resourceTypes).to.be.equal(RESOURCE_TYPE_DAO);

      const resourceID = await zNAResolver.resourceID(
        wilder_beasts,
        RESOURCE_TYPE_DAO
      );
      expect(resourceID).to.be.equal(resourceID1);
    });

    it("Should update resource ID with same resource type", async function () {
      await zNAResolver
        .connect(resourceTypeManager)
        .associateWithResourceType(
          wilder_beasts,
          RESOURCE_TYPE_DAO,
          resourceID1
        );

      await expect(
        zNAResolver
          .connect(resourceTypeManager)
          .associateWithResourceType(
            wilder_beasts,
            RESOURCE_TYPE_DAO,
            resourceID2
          )
      ).to.be.not.reverted;
    });

    it("Should associate with valid zNA and single resource type(temporary)", async function () {
      await zNAResolver
        .connect(resourceTypeManager)
        .associateWithResourceType(
          wilder_beasts,
          RESOURCE_TYPE_DAO,
          resourceID1
        );

      const hasResourceTypeDAO = await zNAResolver.hasResourceType(
        wilder_beasts,
        RESOURCE_TYPE_DAO
      );
      expect(hasResourceTypeDAO).to.be.equal(true);

      const resourceTypes = await zNAResolver.resourceTypes(wilder_beasts);
      // RESOURCE_TYPE_DAO
      expect(resourceTypes.toNumber()).to.be.equal(Number.parseInt("1", 2));

      const resourceIDA = await zNAResolver.resourceID(
        wilder_beasts,
        RESOURCE_TYPE_DAO
      );
      expect(resourceIDA).to.be.equal(resourceID1);

      // Should not allow to associate multiple resource types for same zNA
      await expect(
        zNAResolver
          .connect(resourceTypeManager)
          .associateWithResourceType(
            wilder_beasts,
            RESOURCE_TYPE_STAKING_POOL,
            resourceID2
          )
      ).to.be.revertedWith("Only support single resource type");
    });

    xit("Should associate with valid zNA and multiple resource types", async function () {
      await zNAResolver
        .connect(resourceTypeManager)
        .associateWithResourceType(
          wilder_beasts,
          RESOURCE_TYPE_DAO,
          resourceID1
        );
      await zNAResolver
        .connect(resourceTypeManager)
        .associateWithResourceType(
          wilder_beasts,
          RESOURCE_TYPE_STAKING_POOL,
          resourceID2
        );

      const hasResourceTypeDAO = await zNAResolver.hasResourceType(
        wilder_beasts,
        RESOURCE_TYPE_DAO
      );
      expect(hasResourceTypeDAO).to.be.equal(true);

      const hasResourceTypeStaking = await zNAResolver.hasResourceType(
        wilder_beasts,
        RESOURCE_TYPE_STAKING_POOL
      );
      expect(hasResourceTypeStaking).to.be.equal(true);

      const resourceTypes = await zNAResolver.resourceTypes(wilder_beasts);
      // RESOURCE_TYPE_DAO | RESOURCE_TYPE_STAKING_POOL
      expect(resourceTypes.toNumber()).to.be.equal(Number.parseInt("11", 2));

      const resourceIDA = await zNAResolver.resourceID(
        wilder_beasts,
        RESOURCE_TYPE_DAO
      );
      expect(resourceIDA).to.be.equal(resourceID1);
      const resourceIDB = await zNAResolver.resourceID(
        wilder_beasts,
        RESOURCE_TYPE_STAKING_POOL
      );
      expect(resourceIDB).to.be.equal(resourceID2);
    });
  });
});
