// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721Pausable.sol";
import "./interfaces/IRegistrar.sol";

contract Registrar is IRegistrar, Ownable, ERC721Pausable {
  // Data recorded for each domain
  struct DomainRecord {
    address creator;
    bool metadataLocked;
    address metadataLockedBy;
    address controller;
  }

  // A map of addresses that are authorised to register and renew names.
  mapping(address => bool) public controllers;

  // A mapping of domain id's to domain data
  // This essentially expands the internal ERC721's token storage to additional fields
  mapping(uint256 => DomainRecord) public records;

  modifier onlyController {
    require(controllers[msg.sender], "Not controller");
    _;
  }

  constructor() ERC721("Zer0 Name Service", "ZNS") {
    // create the root domain
    _createDomain(0, msg.sender, msg.sender, address(0));
  }

  // Authorises a controller
  function addController(address controller) external override onlyOwner {
    controllers[controller] = true;
    emit ControllerAdded(controller);
  }

  // Revoke controller permission for an address.
  function removeController(address controller) external override onlyOwner {
    controllers[controller] = false;
    emit ControllerRemoved(controller);
  }

  function available(uint256 id) external view override returns (bool) {
    bool notRegistered = !_exists(id);
    return notRegistered;
  }

  function domainExists(uint256 id) external view override returns (bool) {
    bool domainNftExists = _exists(id);
    return domainNftExists;
  }

  /**
    @notice Registers a new (sub) domain
    @param parent The parent domain
    @param name The name of the domain
    @param domainOwner the owner of the new domain
    @param creator the creator of the new domain
   */
  function registerDomain(
    uint256 parent,
    string memory name,
    address domainOwner,
    address creator
  ) external override onlyController {
    // Create the child domain under the parent domain
    uint256 labelHash = uint256(keccak256(bytes(name)));
    address controller = msg.sender;
    uint256 domainId =
      _registerDomain(parent, labelHash, domainOwner, creator, controller);

    emit DomainCreated(domainId, name, labelHash, parent, creator, controller);
  }

  // Returns the original creator of a domain
  function creatorOf(uint256 id) external view override returns (address) {
    address domainCreator = records[id].creator;
    return domainCreator;
  }

  // Sets a domains metadata uri
  function setDomainMetadataUri(uint256 id, string memory uri)
    external
    override
  {
    require(!records[id].metadataLocked, "Metadata locked");
    require(msg.sender == ownerOf(id), "Not owner");

    _setTokenURI(id, uri);
    emit MetadataChanged(id, uri);
  }

  // Lock a domains metadata from being modified, can only be called by domain owner and if the metadata is unlocked
  function lockDomainMetadata(uint256 id) public override {
    require(!records[id].metadataLocked, "Already locked");
    require(msg.sender == ownerOf(id), "Not owner");

    _lockMetadata(id, msg.sender);
  }

  // Unlocks a domains metadata, can only be called by the address that locked the metadata
  function unlockDomainMetadata(uint256 id) public override {
    require(records[id].metadataLocked, "Already locked");
    require(msg.sender == records[id].metadataLockedBy, "Not locker");

    _unlockMetadata(id);
  }

  // Checks if a domains metadata is locked
  function domainMetadataLocked(uint256 id)
    public
    view
    override
    returns (bool)
  {
    bool isLocked = records[id].metadataLocked;
    return isLocked;
  }

  // Returns the address which locked the domain metadata
  function domainMetadataLockedBy(uint256 id)
    public
    view
    override
    returns (address)
  {
    address lockedBy = records[id].metadataLockedBy;
    return lockedBy;
  }

  function domainController(uint256 id) public view override returns (address) {
    address controller = records[id].controller;
    return controller;
  }

  // Register a new child domain
  function _registerDomain(
    uint256 parent,
    uint256 label,
    address domainOwner,
    address creator,
    address controller
  ) internal returns (uint256) {
    // Domain parents must exist
    require(_exists(parent), "No Parent");

    // Calculate the new domain's id and create it
    uint256 domainId = uint256(keccak256(abi.encodePacked(parent, label)));
    _createDomain(domainId, domainOwner, creator, controller);

    return domainId;
  }

  // Create a domain
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
      controller: controller
    });
  }

  function _lockMetadata(uint256 id, address locker) internal {
    records[id].metadataLocked = true;
    records[id].metadataLockedBy = locker;

    emit MetadataLocked(id, locker);
  }

  function _unlockMetadata(uint256 id) internal {
    records[id].metadataLocked = false;
    records[id].metadataLockedBy = address(0);

    emit MetadataUnlocked(id);
  }
}
