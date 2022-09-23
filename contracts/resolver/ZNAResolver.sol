// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import {ZeroUpgradeable} from "../abstracts/ZeroUpgradeable.sol";
import {IResourceRegistry} from "../interfaces/IResourceRegistry.sol";
import {IZNSHub} from "../interfaces/IZNSHub.sol";
import {IZNAResolver} from "../interfaces/IZNAResolver.sol";

contract ZNAResolver is ZeroUpgradeable, IZNAResolver {
  uint256 public constant RESOURCE_TYPE_DAO = 0x1;
  uint256 public constant RESOURCE_TYPE_STAKING_POOL = 0x2;
  uint256 public constant RESOURCE_TYPE_FARMING = 0x4;

  bytes32 public constant RESOURCE_TYPE_MANAGER_ROLE =
    keccak256(abi.encode("RESOURCE_TYPE_MANAGER"));
  bytes32 public constant RESOURCE_REGISTRY_MANAGER_ROLE =
    keccak256(abi.encode("RESOURCE_REGISTRY_MANAGER"));

  IZNSHub public znsHub;

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

  modifier onlyResourceTypeManagerOrZNAOwner(uint256 _zNA) {
    require(
      hasRole(RESOURCE_TYPE_MANAGER_ROLE, _msgSender()) ||
        znsHub.ownerOf(_zNA) == _msgSender(),
      "Not authorized: resource type manager"
    );
    _;
  }

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

  function __ZNAResolver_init(IZNSHub _znsHub) public initializer {
    _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    _setupRole(RESOURCE_TYPE_MANAGER_ROLE, _msgSender());
    _setupRole(RESOURCE_REGISTRY_MANAGER_ROLE, _msgSender());

    znsHub = _znsHub;
  }

  /* -------------------------------------------------------------------------- */
  /*                             External Functions                             */
  /* -------------------------------------------------------------------------- */

  function setZNSHub(address _znsHub) external onlyRole(DEFAULT_ADMIN_ROLE) {
    znsHub = IZNSHub(_znsHub);
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
  ) external override onlyResourceTypeManagerOrZNAOwner(_zNA) {
    require(znsHub.ownerOf(_zNA) != address(0), "Invalid zNA");
    require(_isValidResourceType(_resourceType), "Invalid resource type");
    require(
      _doesResourceExist(_resourceType, _resourceID),
      "Not exist resource"
    );
    require(
      zNATypes[_zNA] == 0 || _hasResourceType(_zNA, _resourceType),
      "Only support single resource type"
    );

    // Set/Update ResourceID
    zNATypes[_zNA] = zNATypes[_zNA] | _resourceType;
    zNAResourceIDs[_zNA][_resourceType] = _resourceID;

    emit ResourceAssociated(_zNA, _resourceType, _resourceID);
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
    onlyResourceTypeManagerOrZNAOwner(_zNA)
  {
    require(znsHub.ownerOf(_zNA) != address(0), "Invalid zNA");
    require(_isValidResourceType(_resourceType), "Invalid resource type");
    require(_hasResourceType(_zNA, _resourceType), "Should have resource type");

    zNATypes[_zNA] = zNATypes[_zNA] ^ _resourceType;
    delete zNAResourceIDs[_zNA][_resourceType];

    emit ResourceDisassociated(_zNA, _resourceType);
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

    resourceRegistries[_resourceType] = _resourceRegistry;

    emit ResourceRegistryAdded(_resourceType, address(_resourceRegistry));
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
