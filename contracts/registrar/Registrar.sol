// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "../oz/access/OwnableUpgradeable.sol";
import "../oz/token/ERC721/ERC721PausableUpgradeable.sol";
import "../interfaces/IRegistrar.sol";
import "../oz/utils/StorageSlot.sol";
import {BeaconProxy} from "../oz/proxy/beacon/BeaconProxy.sol";

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
    address subdomainContract;
  }

  // A map of addresses that are authorised to register domains.
  mapping(address => bool) public controllers;

  // A mapping of domain id's to domain data
  // This essentially expands the internal ERC721's token storage to additional fields
  mapping(uint256 => DomainRecord) public records;

  /**
   * @dev Storage slot with the admin of the contract.
   * This is the keccak-256 hash of "eip1967.proxy.admin" subtracted by 1, and is
   * validated in the constructor.
   */
  bytes32 internal constant _ADMIN_SLOT =
    0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;

  // The beacon address
  address public beacon;
  uint256 public rootDomainId;
  address public parentRegistrar;

  function _getAdmin() internal view returns (address) {
    return StorageSlot.getAddressSlot(_ADMIN_SLOT).value;
  }

  modifier onlyController() {
    require(controllers[msg.sender], "ZR: Not controller");
    _;
  }

  modifier onlyOwnerOf(uint256 id) {
    require(ownerOf(id) == msg.sender, "ZR: Not owner");
    _;
  }

  function initialize(
    address parentRegistrar_,
    uint256 rootDomainId_,
    string calldata collectionName,
    string calldata collectionSymbol,
    address beacon_,
    address owner_
  ) public initializer {
    __Ownable_init();
    transferOwnership(owner_);

    beacon = beacon_;

    if (parentRegistrar_ == address(0)) {
      // create the root domain
      _createDomain(0, 0, msg.sender, address(0));
    } else {
      rootDomainId = rootDomainId_;
      parentRegistrar = parentRegistrar_;
    }

    __ERC721Pausable_init();
    __ERC721_init(collectionName, collectionSymbol);
  }

  // Used to upgrade existing registrar to new registrar
  function upgradeFromNormalRegistrar(address beacon_) public {
    require(msg.sender == _getAdmin(), "Not Proxy Admin");
    beacon = beacon_;
  }

  /*
   * External Methods
   */

  /**
   * @notice Authorizes a controller to control the registrar
   * @param controller The address of the controller
   */
  function addController(address controller) external {
    require(
      msg.sender == owner() || msg.sender == parentRegistrar,
      "ZR: Not authorized"
    );
    require(!controllers[controller], "ZR: Controller is already added");
    controllers[controller] = true;
    emit ControllerAdded(controller);
  }

  /**
   * @notice Unauthorizes a controller to control the registrar
   * @param controller The address of the controller
   */
  function removeController(address controller) external override onlyOwner {
    require(
      msg.sender == owner() || msg.sender == parentRegistrar,
      "ZR: Not authorized"
    );
    require(controllers[controller], "ZR: Controller does not exist");
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
    return
      _registerDomain(
        parentId,
        name,
        minter,
        metadataUri,
        royaltyAmount,
        locked
      );
  }

  function registerDomainAndSend(
    uint256 parentId,
    string memory name,
    address minter,
    string memory metadataUri,
    uint256 royaltyAmount,
    bool locked,
    address sendToUser
  ) external override onlyController returns (uint256) {
    // Register the domain
    uint256 id = _registerDomain(
      parentId,
      name,
      minter,
      metadataUri,
      royaltyAmount,
      locked
    );

    // immediately send domain to user
    _safeTransfer(minter, sendToUser, id, "");

    return id;
  }

  function registerSubdomainContract(
    uint256 parentId,
    string memory name,
    address minter,
    string memory metadataUri,
    uint256 royaltyAmount,
    bool locked,
    address sendToUser
  ) external onlyController returns (uint256) {
    // Register the domain
    uint256 id = _registerDomain(
      parentId,
      name,
      minter,
      metadataUri,
      royaltyAmount,
      locked
    );

    // create subdomain contract
    // We encode the initialize function so that the beacon proxy
    // will call it on creation, thus initializing the proxy
    bytes memory data = abi.encodeWithSignature(
      "initialize(address,uint256,string,string,address)",
      this,
      id,
      "Zer0 Name Service",
      "ZNS",
      beacon,
      owner()
    );
    address subdomainContract = address(new BeaconProxy(beacon, data));

    // Indicate that the subdomain has a contract
    records[id].subdomainContract = subdomainContract;

    // immediately send domain to user
    _safeTransfer(minter, sendToUser, id, "");

    return id;
  }

  function _registerDomain(
    uint256 parentId,
    string memory name,
    address minter,
    string memory metadataUri,
    uint256 royaltyAmount,
    bool locked
  ) internal returns (uint256) {
    require(bytes(name).length > 0, "ZR: Empty name");
    require(
      records[parentId].subdomainContract == address(0),
      "ZR: Parent is subcontract"
    );
    if (parentId != rootDomainId) {
      // Domain parents must exist
      require(_exists(parentId), "ZR: No parent");
    }

    // Create the child domain under the parent domain
    uint256 labelHash = uint256(keccak256(bytes(name)));
    address controller = msg.sender;

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
    require(!isDomainMetadataLocked(id), "ZR: Metadata locked");

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
    require(!isDomainMetadataLocked(id), "ZR: Metadata locked");
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
    require(!isDomainMetadataLocked(id), "ZR: Metadata locked");
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

  function ownerOf(uint256 tokenId)
    public
    view
    virtual
    override(ERC721Upgradeable, IERC721Upgradeable)
    returns (address)
  {
    // Route `ownerOf` requests to the parent registrar
    if (tokenId == rootDomainId) {
      return Registrar(parentRegistrar).ownerOf(tokenId);
    }

    return ERC721Upgradeable.ownerOf(tokenId);
  }

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
    require(_exists(id), "ZR: Does not exist");

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
      require(ownerOf(id) == msg.sender, "ZR: Not owner");
      require(!isDomainMetadataLocked(id), "ZR: Metadata locked");
    } else {
      require(isDomainMetadataLocked(id), "ZR: Not locked");
      require(domainMetadataLockedBy(id) == msg.sender, "ZR: Not locker");
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
    _mint(minter, domainId);
    records[domainId] = DomainRecord({
      parentId: parentId,
      minter: minter,
      metadataLocked: false,
      metadataLockedBy: address(0),
      controller: controller,
      royaltyAmount: 0,
      subdomainContract: address(0)
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
    _burn(tokenId);
    delete (records[tokenId]);
  }

  function adminTransfer(
    address from,
    address to,
    uint256 tokenId
  ) external onlyOwner {
    _transfer(from, to, tokenId);
  }
}
