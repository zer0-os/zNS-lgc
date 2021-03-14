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
    uint256 royaltyAmount;
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

  // Sets the asked royalty amount on a domain (amount is a percentage with 5 decimal places)
  function setDomainRoyaltyAmount(uint256 id, uint256 amount)
    external
    override
  {
    require(records[id].creator == msg.sender, "Not Creator");

    records[id].royaltyAmount = amount;

    emit RoyaltiesAmountChanged(id, amount);
  }

  // View Methods

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
    require(ownerOf(id) == msg.sender, "Not owner");

    _setTokenURI(id, uri);
    emit MetadataChanged(id, uri);
  }

  // Lock a domains metadata from being modified, can only be called by domain owner and if the metadata is unlocked
  function lockDomainMetadata(uint256 id) public override {
    require(!records[id].metadataLocked, "Already locked");
    require(ownerOf(id) == msg.sender, "Not owner");

    _lockMetadata(id, msg.sender);
  }

  // Unlocks a domains metadata, can only be called by the address that locked the metadata
  function unlockDomainMetadata(uint256 id) public override {
    require(records[id].metadataLocked, "Already locked");
    require(records[id].metadataLockedBy == msg.sender, "Not locker");

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

  // Gets the controller that registered a domain
  function domainController(uint256 id) public view override returns (address) {
    address controller = records[id].controller;
    return controller;
  }

  // Gets a domains current royalty amount
  function domainRoyaltyAmount(uint256 id)
    public
    view
    override
    returns (uint256)
  {
    uint256 amount = records[id].royaltyAmount;
    return amount;
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
      controller: controller,
      royaltyAmount: 0
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
