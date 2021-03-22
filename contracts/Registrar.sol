// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721PausableUpgradeable.sol";
import "./interfaces/IRegistrar.sol";

contract Registrar is
  IRegistrar,
  OwnableUpgradeable,
  ERC721PausableUpgradeable
{
  // Data recorded for each domain
  struct DomainRecord {
    address creator;
    bool metadataLocked;
    address metadataLockedBy;
    address controller;
    uint256 royaltyAmount;
  }

  // A map of addresses that are authorised to register domains.
  mapping(address => bool) public controllers;

  // A mapping of domain id's to domain data
  // This essentially expands the internal ERC721's token storage to additional fields
  mapping(uint256 => DomainRecord) public records;

  modifier onlyController {
    require(controllers[msg.sender], "Not controller");
    _;
  }

  modifier onlyOwnerOf(uint256 id) {
    require(ownerOf(id) == msg.sender, "Not owner");
    _;
  }

  function initialize() public initializer {
    __Ownable_init();
    __ERC721_init("Zer0 Name Service", "ZNS");

    // create the root domain
    _createDomain(0, msg.sender, msg.sender, address(0));
  }

  /**
    @notice Authorizes a controller to control the registrar
    @param controller The address of the controller
   */
  function addController(address controller) external override onlyOwner {
    controllers[controller] = true;
    emit ControllerAdded(controller);
  }

  /**
    @notice Unauthorizes a controller to control the registrar
    @param controller The address of the controller
   */
  function removeController(address controller) external override onlyOwner {
    controllers[controller] = false;
    emit ControllerRemoved(controller);
  }

  /**
    @notice Registers a new (sub) domain
    @param parentId The parent domain
    @param name The name of the domain
    @param domainOwner the owner of the new domain
    @param creator the creator of the new domain
   */
  function registerDomain(
    uint256 parentId,
    string memory name,
    address domainOwner,
    address creator
  ) external override onlyController returns (uint256) {
    // Create the child domain under the parent domain
    uint256 labelHash = uint256(keccak256(bytes(name)));
    address controller = msg.sender;

    // Domain parents must exist
    require(_exists(parentId), "No parent");

    // Calculate the new domain's id and create it
    uint256 domainId =
      uint256(keccak256(abi.encodePacked(parentId, labelHash)));
    _createDomain(domainId, domainOwner, creator, controller);

    emit DomainCreated(
      domainId,
      name,
      labelHash,
      parentId,
      creator,
      controller
    );

    return domainId;
  }

  /**
    @notice Sets the domain royalty amount
    @param id The domain to set on
    @param amount The royalty amount
   */
  function setDomainRoyaltyAmount(uint256 id, uint256 amount)
    external
    override
    onlyOwnerOf(id)
  {
    require(!isDomainMetadataLocked(id), "Metadata locked");

    records[id].royaltyAmount = amount;
    emit RoyaltiesAmountChanged(id, amount);
  }

  /**
    @notice Sets the domain metadata uri
    @param id The domain to set on
    @param uri The uri to set
   */
  function setDomainMetadataUri(uint256 id, string memory uri)
    external
    override
    onlyOwnerOf(id)
  {
    require(!isDomainMetadataLocked(id), "Metadata locked");

    _setTokenURI(id, uri);
    emit MetadataChanged(id, uri);
  }

  /**
    @notice Locks a domains metadata uri
    @param id The domain to lock
   */
  function lockDomainMetadata(uint256 id) public override onlyOwnerOf(id) {
    require(!isDomainMetadataLocked(id), "Metadata locked");

    _lockMetadata(id, msg.sender);
  }

  /**
    @notice Locks a domains metadata uri on behalf the owner
    @param id The domain to lock
   */
  function lockDomainMetadataForOwner(uint256 id)
    public
    override
    onlyController
  {
    require(!isDomainMetadataLocked(id), "Metadata locked");

    address domainOwner = ownerOf(id);
    _lockMetadata(id, domainOwner);
  }

  /**
    @notice Unlocks a domains metadata uri
    @param id The domain to unlock
   */
  function unlockDomainMetadata(uint256 id) public override {
    require(isDomainMetadataLocked(id), "Not locked");
    require(domainMetadataLockedBy(id) == msg.sender, "Not locker");

    _unlockMetadata(id);
  }

  // View Methods

  /**
    @notice Returns whether or not a domain is available to be created
    @param id The domain
   */
  function isAvailable(uint256 id) public view override returns (bool) {
    bool notRegistered = !_exists(id);
    return notRegistered;
  }

  /**
    @notice Returns whether or not a domain is exists
    @param id The domain
   */
  function domainExists(uint256 id) public view override returns (bool) {
    bool domainNftExists = _exists(id);
    return domainNftExists;
  }

  /**
    @notice Returns the original creator of a domain
    @param id The domain
   */
  function creatorOf(uint256 id) public view override returns (address) {
    address domainCreator = records[id].creator;
    return domainCreator;
  }

  /**
    @notice Returns whether or not a domain's metadata is locked
    @param id The domain
   */
  function isDomainMetadataLocked(uint256 id)
    public
    view
    override
    returns (bool)
  {
    bool isLocked = records[id].metadataLocked;
    return isLocked;
  }

  /**
    @notice Returns who locked a domain's metadata
    @param id The domain
   */
  function domainMetadataLockedBy(uint256 id)
    public
    view
    override
    returns (address)
  {
    address lockedBy = records[id].metadataLockedBy;
    return lockedBy;
  }

  /**
    @notice Returns the controller which created the domain on behalf of a user
    @param id The domain
   */
  function domainController(uint256 id) public view override returns (address) {
    address controller = records[id].controller;
    return controller;
  }

  /**
    @notice Returns the current royalty amount for a domain
    @param id The domain
   */
  function domainRoyaltyAmount(uint256 id)
    public
    view
    override
    returns (uint256)
  {
    uint256 amount = records[id].royaltyAmount;
    return amount;
  }

  // internal - creates a domain
  function _createDomain(
    uint256 domainId,
    address domainOwner,
    address creator,
    address controller
  ) internal {
    // Create the NFT and register the domain data
    _safeMint(domainOwner, domainId);
    records[domainId] = DomainRecord({
      creator: creator,
      metadataLocked: false,
      metadataLockedBy: address(0),
      controller: controller,
      royaltyAmount: 0
    });
  }

  // internal - locks a domains metadata
  function _lockMetadata(uint256 id, address locker) internal {
    records[id].metadataLocked = true;
    records[id].metadataLockedBy = locker;

    emit MetadataLocked(id, locker);
  }

  // internal - unlocks a domains metadata
  function _unlockMetadata(uint256 id) internal {
    records[id].metadataLocked = false;
    records[id].metadataLockedBy = address(0);

    emit MetadataUnlocked(id);
  }
}
