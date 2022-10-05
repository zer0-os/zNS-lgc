// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import {AccessControlUpgradeable} from "../oz442/access/AccessControlUpgradeable.sol";
import {IResourceRegistry} from "../interfaces/IResourceRegistry.sol";
import {IZNSHub} from "../interfaces/IZNSHub.sol";
import {IZNAResolver} from "../interfaces/IZNAResolver.sol";
import {ResourceType} from "../libraries/ResourceType.sol";

contract ZNAResolver is AccessControlUpgradeable, IZNAResolver {
  // Role with who can associate zNA with resource type.
  bytes32 public constant RESOURCE_TYPE_MANAGER_ROLE =
    keccak256(abi.encode("RESOURCE_TYPE_MANAGER"));
  // Role with who can add resource registry to zNAResolver.
  bytes32 public constant RESOURCE_REGISTRY_MANAGER_ROLE =
    keccak256(abi.encode("RESOURCE_REGISTRY_MANAGER"));

  IZNSHub public zNSHub;

  // <zNA => ResourceType>
  // ResourceTypes = DAO | StakingPool | Farming | ...
  mapping(uint256 => uint256) public zNATypes;

  // <zNA => <ResourceType => ResourceID>>
  // ResourceID can be zDAOId or StakingPoolId or hash Id for other resource
  // Single zNA can have multiple different resource
  mapping(uint256 => mapping(uint256 => uint256)) public zNAResourceIDs;

  // <ResourceType, ResourceRegistry>
  mapping(uint256 => IResourceRegistry) public resourceRegistries;

  /* -------------------------------------------------------------------------- */
  /*                                  Modifiers                                 */
  /* -------------------------------------------------------------------------- */

  modifier onlyResourceRegistryManager() {
    require(
      hasRole(RESOURCE_REGISTRY_MANAGER_ROLE, _msgSender()),
      "Not authorized: resource registry manager"
    );
    _;
  }

  /* -------------------------------------------------------------------------- */
  /*                                 Initializer                                */
  /* -------------------------------------------------------------------------- */

  function initialize(IZNSHub zNSHub_) public initializer {
    __AccessControl_init();

    _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    _setupRole(RESOURCE_TYPE_MANAGER_ROLE, _msgSender());
    _setupRole(RESOURCE_REGISTRY_MANAGER_ROLE, _msgSender());

    zNSHub = zNSHub_;
  }

  /* -------------------------------------------------------------------------- */
  /*                             External Functions                             */
  /* -------------------------------------------------------------------------- */

  function setZNSHub(address zNSHub_) external onlyRole(DEFAULT_ADMIN_ROLE) {
    zNSHub = IZNSHub(zNSHub_);
  }

  function setupResourceRegistryManagerRole(address manager)
    external
    onlyRole(DEFAULT_ADMIN_ROLE)
  {
    _setupRole(RESOURCE_REGISTRY_MANAGER_ROLE, manager);
  }

  /**
   * @notice Associate zNA with resource type.
   *     Single zNA can have multiple different resource type and single
   *     resource ID per each resource type.
   * @dev Only callable by zNA Owner or the resource type manager
   * @param zNA Associating zNA
   * @param resourceType Single resource type. Check above constants.
   * @param resourceID_ Allocated resource ID. Resource ID can be zDAOId or
   *     StakingPoolId or hash Id for other resource
   */
  function associateWithResourceType(
    uint256 zNA,
    uint256 resourceType,
    uint256 resourceID_
  ) external override {
    require(zNSHub.domainExists(zNA), "Invalid zNA");
    require(_isValidResourceType(resourceType), "Invalid resource type");
    require(
      _doesResourceExist(resourceType, resourceID_),
      "Not exist resource"
    );
    _isResourceTypeAuthorized(zNA, resourceType);

    _associateWithResourceType(zNA, resourceType, resourceID_);
  }

  /**
   * @notice Disassociate zNA with resource type, it will automatically
   *     remove allocated resource ID of given resource type.
   * @dev Only callable by zNAOwner
   * @param zNA Associating zNA
   * @param resourceType Single resource type. Check above constants
   */
  function disassociateWithResourceType(uint256 zNA, uint256 resourceType)
    external
    override
  {
    require(zNSHub.domainExists(zNA), "Invalid zNA");
    require(_isValidResourceType(resourceType), "Invalid resource type");
    require(
      zNSHub.ownerOf(zNA) == _msgSender(),
      "Not authorized: resource type manager"
    );
    require(_hasResourceType(zNA, resourceType), "Should have resource type");

    _disassociateWithResourceType(zNA, resourceType);
  }

  /**
   * @notice Add resource registry with its resource type. Every resource type
   *     can have a single resource registry.
   *     Resource registry is responsible to check if resource exists here.
   * @dev Only callable by resource registry manager
   * @param resourceType Single resource type. Check above constants
   * @param resourceRegistry_ Address to ResourceRegistry contract
   */
  function addResourceRegistry(
    uint256 resourceType,
    IResourceRegistry resourceRegistry_
  ) external override onlyResourceRegistryManager {
    require(_isValidResourceType(resourceType), "Invalid resource type");

    address oldRegistry = address(resourceRegistries[resourceType]);
    if (oldRegistry != address(0)) {
      // Revole ResoureceTypeManager role from old ResourceRegistry
      _revokeRole(RESOURCE_TYPE_MANAGER_ROLE, oldRegistry);

      emit ResourceRegistryRemoved(resourceType, oldRegistry);
    }
    // Grant ResoureceTypeManager role to new ResourceRegistry
    resourceRegistries[resourceType] = resourceRegistry_;
    _setupRole(RESOURCE_TYPE_MANAGER_ROLE, address(resourceRegistry_));

    emit ResourceRegistryAdded(resourceType, address(resourceRegistry_));
  }

  function removeResourceRegistry(uint256 resourceType)
    external
    override
    onlyResourceRegistryManager
  {
    require(_isValidResourceType(resourceType), "Invalid resource type");
    address oldRegistry = address(resourceRegistries[resourceType]);
    require(oldRegistry != address(0), "Should have resource registry");

    delete resourceRegistries[resourceType];
    _revokeRole(RESOURCE_TYPE_MANAGER_ROLE, oldRegistry);

    emit ResourceRegistryRemoved(resourceType, oldRegistry);
  }

  /* -------------------------------------------------------------------------- */
  /*                             Internal Functions                             */
  /* -------------------------------------------------------------------------- */

  /**
   * @notice Check if resource type is valid. Only allow for pre-defined types
   */
  function _isValidResourceType(uint256 resourceType)
    internal
    pure
    returns (bool)
  {
    return (resourceType == ResourceType.RESOURCE_TYPE_DAO ||
      resourceType == ResourceType.RESOURCE_TYPE_STAKING_POOL);
  }

  /**
   * @notice Check if zNA has given resource type. Single zNA can have multiple
   *     resource types by binary OR calculation.
   *     If AND(current type, compare type) > 0, then return true.
   */
  function _hasResourceType(uint256 zNA, uint256 resourceType)
    internal
    view
    returns (bool)
  {
    return (zNATypes[zNA] & resourceType) > 0;
  }

  /**
   * @notice Check if resource exists by integrating with ResourceRegistry
   */
  function _doesResourceExist(uint256 resourceType, uint256 resourceID_)
    internal
    view
    returns (bool)
  {
    IResourceRegistry registry = resourceRegistries[resourceType];
    assert(address(registry) != address(0));
    return registry.resourceExists(resourceID_);
  }

  function _isResourceTypeAuthorized(uint256 zNA, uint256 resourceType)
    internal
    view
  {
    if (zNSHub.ownerOf(zNA) != _msgSender()) {
      if (!hasRole(RESOURCE_TYPE_MANAGER_ROLE, _msgSender())) {
        revert("Not authorized: resource type manager");
      }
      require(
        address(resourceRegistries[resourceType]) == _msgSender(),
        "Only allow to manage registered resource type"
      );
    }
  }

  function _associateWithResourceType(
    uint256 zNA,
    uint256 resourceType,
    uint256 resourceID_
  ) internal {
    if (zNATypes[zNA] > 0 && !_hasResourceType(zNA, resourceType)) {
      _disassociateWithResourceType(zNA, zNATypes[zNA]);
    }

    // Set/Update ResourceID
    zNATypes[zNA] = zNATypes[zNA] | resourceType;
    zNAResourceIDs[zNA][resourceType] = resourceID_;

    emit ResourceAssociated(zNA, resourceType, resourceID_);
  }

  function _disassociateWithResourceType(uint256 zNA, uint256 resourceType)
    internal
  {
    zNATypes[zNA] = zNATypes[zNA] ^ resourceType;
    uint256 oldResourceID = zNAResourceIDs[zNA][resourceType];
    delete zNAResourceIDs[zNA][resourceType];

    emit ResourceDisassociated(zNA, resourceType, oldResourceID);
  }

  /* -------------------------------------------------------------------------- */
  /*                               View Functions                               */
  /* -------------------------------------------------------------------------- */

  function hasResourceType(uint256 zNA, uint256 resourceType)
    external
    view
    override
    returns (bool)
  {
    return _hasResourceType(zNA, resourceType);
  }

  function resourceTypes(uint256 zNA) external view override returns (uint256) {
    return zNATypes[zNA];
  }

  function resourceID(uint256 zNA, uint256 resourceType)
    external
    view
    override
    returns (uint256)
  {
    return zNAResourceIDs[zNA][resourceType];
  }

  function resourceRegistry(uint256 resourceType)
    external
    view
    override
    returns (IResourceRegistry)
  {
    return resourceRegistries[resourceType];
  }
}
