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
    address minter;
    bool metadataLocked;
    address metadataLockedBy;
    address controller;
    uint256 royaltyAmount;
    uint256 parentId;
  }

  // A map of addresses that are authorised to register domains.
  mapping(address => bool) public controllers;

  // A mapping of domain id's to domain data
  // This essentially expands the internal ERC721's token storage to additional fields
  mapping(uint256 => DomainRecord) public records;

  modifier onlyController() {
    require(controllers[msg.sender], "Zer0 Registrar: Not controller");
    _;
  }

  modifier onlyOwnerOf(uint256 id) {
    require(ownerOf(id) == msg.sender, "Zer0 Registrar: Not owner");
    _;
  }

  function initialize() public initializer {
    __Ownable_init();

    __ERC721Pausable_init();
    __ERC721_init("Zer0 Name Service", "ZNS");

    // create the root domain
    _createDomain(0, 0, msg.sender, address(0));
  }

  /*
   * External Methods
   */

  /**
   * @notice Authorizes a controller to control the registrar
   * @param controller The address of the controller
   */
  function addController(address controller) external override onlyOwner {
    require(
      !controllers[controller],
      "Zer0 Registrar: Controller is already added"
    );
    controllers[controller] = true;
    emit ControllerAdded(controller);
  }

  /**
   * @notice Unauthorizes a controller to control the registrar
   * @param controller The address of the controller
   */
  function removeController(address controller) external override onlyOwner {
    require(
      controllers[controller],
      "Zer0 Registrar: Controller does not exist"
    );
    controllers[controller] = false;
    emit ControllerRemoved(controller);
  }

  /**
   * @notice Pauses the registrar. Can only be done when not paused.
   */
  function pause() external onlyOwner {
    _pause();
  }

  /**
   * @notice Unpauses the registrar. Can only be done when not paused.
   */
  function unpause() external onlyOwner {
    _unpause();
  }

  /**
   * @notice Registers a new (sub) domain
   * @param parentId The parent domain
   * @param name The name of the domain
   * @param minter the minter of the new domain
   * @param metadataUri The uri of the metadata
   * @param royaltyAmount The amount of royalty this domain pays
   * @param locked Whether the domain is locked or not
   */
  function registerDomain(
    uint256 parentId,
    string memory name,
    address minter,
    string memory metadataUri,
    uint256 royaltyAmount,
    bool locked
  ) external override onlyController returns (uint256) {
    require(bytes(name).length > 0, "Zer0 Registrar: Empty name");

    // Create the child domain under the parent domain
    uint256 labelHash = uint256(keccak256(bytes(name)));
    address controller = msg.sender;

    // Domain parents must exist
    require(_exists(parentId), "Zer0 Registrar: No parent");

    // Calculate the new domain's id and create it
    uint256 domainId = uint256(
      keccak256(abi.encodePacked(parentId, labelHash))
    );
    _createDomain(parentId, domainId, minter, controller);
    _setTokenURI(domainId, metadataUri);

    if (locked) {
      _setDomainLock(domainId, minter, true);
    }

    if (royaltyAmount > 0) {
      records[domainId].royaltyAmount = royaltyAmount;
      emit RoyaltiesAmountChanged(domainId, royaltyAmount);
    }

    emit DomainCreated(
      domainId,
      name,
      labelHash,
      parentId,
      minter,
      controller,
      metadataUri,
      royaltyAmount
    );

    return domainId;
  }

  /**
   * @notice Sets the domain royalty amount
   * @param id The domain to set on
   * @param amount The royalty amount
   */
  function setDomainRoyaltyAmount(uint256 id, uint256 amount)
    external
    override
    onlyOwnerOf(id)
  {
    require(!isDomainMetadataLocked(id), "Zer0 Registrar: Metadata locked");

    records[id].royaltyAmount = amount;
    emit RoyaltiesAmountChanged(id, amount);
  }

  /**
   * @notice Both sets and locks domain metadata uri in a single call
   * @param id The domain to lock
   * @param uri The uri to set
   */
  function setAndLockDomainMetadata(uint256 id, string memory uri)
    external
    override
    onlyOwnerOf(id)
  {
    require(!isDomainMetadataLocked(id), "Zer0 Registrar: Metadata locked");
    _setDomainMetadataUri(id, uri);
    _setDomainLock(id, msg.sender, true);
  }

  /**
   * @notice Sets the domain metadata uri
   * @param id The domain to set on
   * @param uri The uri to set
   */
  function setDomainMetadataUri(uint256 id, string memory uri)
    external
    override
    onlyOwnerOf(id)
  {
    require(!isDomainMetadataLocked(id), "Zer0 Registrar: Metadata locked");
    _setDomainMetadataUri(id, uri);
  }

  /**
   * @notice Locks a domains metadata uri
   * @param id The domain to lock
   * @param toLock whether the domain should be locked or not
   */
  function lockDomainMetadata(uint256 id, bool toLock) external override {
    _validateLockDomainMetadata(id, toLock);
    _setDomainLock(id, msg.sender, toLock);
  }

  /*
   * Public View
   */

  /**
   * @notice Returns whether or not an account is a a controller
   * @param account Address of account to check
   */
  function isController(address account) external view override returns (bool) {
    bool accountIsController = controllers[account];
    return accountIsController;
  }

  /**
   * @notice Returns whether or not a domain is exists
   * @param id The domain
   */
  function domainExists(uint256 id) public view override returns (bool) {
    bool domainNftExists = _exists(id);
    return domainNftExists;
  }

  /**
   * @notice Returns the original minter of a domain
   * @param id The domain
   */
  function minterOf(uint256 id) public view override returns (address) {
    address minter = records[id].minter;
    return minter;
  }

  /**
   * @notice Returns whether or not a domain's metadata is locked
   * @param id The domain
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
   * @notice Returns who locked a domain's metadata
   * @param id The domain
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
   * @notice Returns the controller which created the domain on behalf of a user
   * @param id The domain
   */
  function domainController(uint256 id) public view override returns (address) {
    address controller = records[id].controller;
    return controller;
  }

  /**
   * @notice Returns the current royalty amount for a domain
   * @param id The domain
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

  /**
   * @notice Returns the parent id of a domain.
   * @param id The domain
   */
  function parentOf(uint256 id) public view override returns (uint256) {
    require(_exists(id), "Zer0 Registrar: Does not exist");

    uint256 parentId = records[id].parentId;
    return parentId;
  }

  /*
   * Internal Methods
   */

  function _setDomainMetadataUri(uint256 id, string memory uri) internal {
    _setTokenURI(id, uri);
    emit MetadataChanged(id, uri);
  }

  function _validateLockDomainMetadata(uint256 id, bool toLock) internal view {
    if (toLock) {
      require(ownerOf(id) == msg.sender, "Zer0 Registrar: Not owner");
      require(!isDomainMetadataLocked(id), "Zer0 Registrar: Metadata locked");
    } else {
      require(isDomainMetadataLocked(id), "Zer0 Registrar: Not locked");
      require(
        domainMetadataLockedBy(id) == msg.sender,
        "Zer0 Registrar: Not locker"
      );
    }
  }

  // internal - creates a domain
  function _createDomain(
    uint256 parentId,
    uint256 domainId,
    address minter,
    address controller
  ) internal {
    // Create the NFT and register the domain data
    _safeMint(minter, domainId);
    records[domainId] = DomainRecord({
      parentId: parentId,
      minter: minter,
      metadataLocked: false,
      metadataLockedBy: address(0),
      controller: controller,
      royaltyAmount: 0
    });
  }

  function _setDomainLock(
    uint256 id,
    address locker,
    bool lockStatus
  ) internal {
    records[id].metadataLockedBy = locker;
    records[id].metadataLocked = lockStatus;

    emit MetadataLockChanged(id, locker, lockStatus);
  }

  function burnToken(uint256 tokenId) external onlyOwner {
    transferFrom(ownerOf(tokenId), address(0), tokenId);
    delete (records[tokenId]);
  }
}
