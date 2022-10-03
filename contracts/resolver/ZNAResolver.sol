// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import {AccessControlUpgradeable} from "../oz442/access/AccessControlUpgradeable.sol";
import {IResourceRegistry} from "../interfaces/IResourceRegistry.sol";
import {IZNSHub} from "../interfaces/IZNSHub.sol";
import {IZNAResolver} from "../interfaces/IZNAResolver.sol";

contract ZNAResolver is AccessControlUpgradeable, IZNAResolver {
  uint256 public constant RESOURCE_TYPE_DAO = 0x1;
  uint256 public constant RESOURCE_TYPE_STAKING_POOL = 0x2;
  uint256 public constant RESOURCE_TYPE_FARMING = 0x4;

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

  function initialize(IZNSHub _zNSHub) public initializer {
    __AccessControl_init();

    _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    _setupRole(RESOURCE_TYPE_MANAGER_ROLE, _msgSender());
    _setupRole(RESOURCE_REGISTRY_MANAGER_ROLE, _msgSender());

    zNSHub = _zNSHub;
  }

  /* -------------------------------------------------------------------------- */
  /*                             External Functions                             */
  /* -------------------------------------------------------------------------- */

  function setZNSHub(address _zNSHub) external onlyRole(DEFAULT_ADMIN_ROLE) {
    zNSHub = IZNSHub(_zNSHub);
  }

  function setupResourceRegistryManagerRole(address _manager)
    external
    onlyRole(DEFAULT_ADMIN_ROLE)
  {
    _setupRole(RESOURCE_REGISTRY_MANAGER_ROLE, _manager);
  }

  /**
   * @notice Associate zNA with resource type.
   *     Single zNA can have multiple different resource type and single
   *     resource ID per each resource type.
   * @dev Only callable by zNA Owner or the resource type manager
   * @param _zNA Associating zNA
   * @param _resourceType Single resource type. Check above constants.
   * @param _resourceID Allocated resource ID. Resource ID can be zDAOId or
   *     StakingPoolId or hash Id for other resource
   */
  function associateWithResourceType(
    uint256 _zNA,
    uint256 _resourceType,
    uint256 _resourceID
  ) external override {
    require(zNSHub.domainExists(_zNA), "Invalid zNA");
    require(_isValidResourceType(_resourceType), "Invalid resource type");
    require(
      _doesResourceExist(_resourceType, _resourceID),
      "Not exist resource"
    );
    _isResourceTypeAuthorized(_zNA, _resourceType);

    _associateWithResourceType(_zNA, _resourceType, _resourceID);
  }

  /**
   * @notice Disassociate zNA with resource type, it will automatically
   *     remove allocated resource ID of given resource type.
   * @dev Only callable by resource type manager
   * @param _zNA Associating zNA
   * @param _resourceType Single resource type. Check above constants
   */
  function disassociateWithResourceType(uint256 _zNA, uint256 _resourceType)
    external
    override
  {
    require(zNSHub.domainExists(_zNA), "Invalid zNA");
    require(_isValidResourceType(_resourceType), "Invalid resource type");
    require(_hasResourceType(_zNA, _resourceType), "Should have resource type");
    _isResourceTypeAuthorized(_zNA, _resourceType);

    _disassociateWithResourceType(_zNA, _resourceType);
  }

  /**
   * @notice Add resource registry with its resource type. Every resource type
   *     can have a single resource registry.
   *     Resource registry is responsible to check if resource exists here.
   * @dev Only callable by resource registry manager
   * @param _resourceType Single resource type. Check above constants
   * @param _resourceRegistry Address to ResourceRegistry contract
   */
  function addResourceRegistry(
    uint256 _resourceType,
    IResourceRegistry _resourceRegistry
  ) external override onlyResourceRegistryManager {
    require(_isValidResourceType(_resourceType), "Invalid resource type");

    if (address(resourceRegistries[_resourceType]) != address(0)) {
      // Revole ResoureceTypeManager role from old ResourceRegistry
      _revokeRole(
        RESOURCE_TYPE_MANAGER_ROLE,
        address(resourceRegistries[_resourceType])
      );
    }
    // Grant ResoureceTypeManager role to new ResourceRegistry
    resourceRegistries[_resourceType] = _resourceRegistry;
    _setupRole(RESOURCE_TYPE_MANAGER_ROLE, address(_resourceRegistry));

    emit ResourceRegistryAdded(_resourceType, address(_resourceRegistry));
  }

  function removeResourceRegistry(uint256 _resourceType)
    external
    override
    onlyResourceRegistryManager
  {
    require(_isValidResourceType(_resourceType), "Invalid resource type");
    address oldRegistry = address(resourceRegistries[_resourceType]);
    require(oldRegistry != address(0), "Should have resource registry");

    delete resourceRegistries[_resourceType];
    _revokeRole(RESOURCE_TYPE_MANAGER_ROLE, oldRegistry);

    emit ResourceRegistryRemoved(_resourceType, oldRegistry);
  }

  /* -------------------------------------------------------------------------- */
  /*                             Internal Functions                             */
  /* -------------------------------------------------------------------------- */

  /**
   * @notice Check if resource type is valid. Only allow for pre-defined types
   */
  function _isValidResourceType(uint256 _resourceType)
    internal
    pure
    returns (bool)
  {
    return (_resourceType == RESOURCE_TYPE_DAO ||
      _resourceType == RESOURCE_TYPE_STAKING_POOL ||
      _resourceType == RESOURCE_TYPE_FARMING);
  }

  /**
   * @notice Check if zNA has given resource type. Single zNA can have multiple
   *     resource types by binary OR calculation.
   *     If AND(current type, compare type) > 0, then return true.
   */
  function _hasResourceType(uint256 _zNA, uint256 _resourceType)
    internal
    view
    returns (bool)
  {
    return (zNATypes[_zNA] & _resourceType) > 0;
  }

  /**
   * @notice Check if resource exists by integrating with ResourceRegistry
   */
  function _doesResourceExist(uint256 _resourceType, uint256 _resourceID)
    internal
    view
    returns (bool)
  {
    IResourceRegistry registry = resourceRegistries[_resourceType];
    assert(address(registry) != address(0));
    return registry.resourceExists(_resourceID);
  }

  function _isResourceTypeAuthorized(uint256 _zNA, uint256 _resourceType)
    internal
    view
  {
    if (zNSHub.ownerOf(_zNA) != _msgSender()) {
      if (!hasRole(RESOURCE_TYPE_MANAGER_ROLE, _msgSender())) {
        revert("Not authorized: resource type manager");
      }
      require(
        address(resourceRegistries[_resourceType]) == _msgSender(),
        "Not authorized: resource type manager"
      );
    }
  }

  function _associateWithResourceType(
    uint256 _zNA,
    uint256 _resourceType,
    uint256 _resourceID
  ) internal {
    if (_hasResourceType(_zNA, _resourceType)) {
      _disassociateWithResourceType(_zNA, _resourceType);
    } else if (zNATypes[_zNA] > 0) {
      // At this moment, do not support multiple resource type per a zNA
      revert("Only support single resource type");
    }

    // Set/Update ResourceID
    zNATypes[_zNA] = zNATypes[_zNA] | _resourceType;
    zNAResourceIDs[_zNA][_resourceType] = _resourceID;

    emit ResourceAssociated(_zNA, _resourceType, _resourceID);
  }

  function _disassociateWithResourceType(uint256 _zNA, uint256 _resourceType)
    internal
  {
    zNATypes[_zNA] = zNATypes[_zNA] ^ _resourceType;
    uint256 oldResourceID = zNAResourceIDs[_zNA][_resourceType];
    delete zNAResourceIDs[_zNA][_resourceType];

    emit ResourceDisassociated(_zNA, _resourceType, oldResourceID);
  }

  /* -------------------------------------------------------------------------- */
  /*                               View Functions                               */
  /* -------------------------------------------------------------------------- */

  function hasResourceType(uint256 _zNA, uint256 _resourceType)
    external
    view
    override
    returns (bool)
  {
    return _hasResourceType(_zNA, _resourceType);
  }

  function resourceTypes(uint256 _zNA)
    external
    view
    override
    returns (uint256)
  {
    return zNATypes[_zNA];
  }

  function resourceID(uint256 _zNA, uint256 _resourceType)
    external
    view
    override
    returns (uint256)
  {
    return zNAResourceIDs[_zNA][_resourceType];
  }

  function resourceRegistry(uint256 _resourceType)
    external
    view
    override
    returns (IResourceRegistry)
  {
    return resourceRegistries[_resourceType];
  }
}
