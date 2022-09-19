// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {ContextUpgradeable} from "../oz/utils/ContextUpgradeable.sol";
import {ERC165Upgradeable} from "../oz/introspection/ERC165Upgradeable.sol";
import {OwnableUpgradeable} from "../oz/access/OwnableUpgradeable.sol";
import {IRegistrar} from "../interfaces/IRegistrar.sol";
import "../interfaces/IZNSHub.sol";

contract ZNSHub is
  ContextUpgradeable,
  ERC165Upgradeable,
  IZNSHub,
  OwnableUpgradeable
{
  // Contains all zNS Registrars that are authentic
  mapping(address => bool) public authorizedRegistrars;

  // Contains all authorized global zNS controllers
  mapping(address => bool) public controllers;

  // The original default registrar
  address public defaultRegistrar;

  // Contains mapping of domain id to contract
  mapping(uint256 => address) public domainToContract;

  // Contains mapping of root domain id => subdomain registrar
  mapping(uint256 => address) public subdomainRegistrars;

  // Beacon Proxy used by zNS Registrars
  address public beacon;

  uint8 private test;

  modifier onlyRegistrar() {
    require(authorizedRegistrars[msg.sender], "REE: Not authorized registrar");
    _;
  }

  function initialize(address defaultRegistrar_, address registrarBeacon_)
    public
    initializer
  {
    __ERC165_init();
    __Context_init();
    __Ownable_init();
    defaultRegistrar = defaultRegistrar_;
    beacon = registrarBeacon_;
  }

  function setDefaultRegistrar(address defaultRegistrar_) public onlyOwner {
    defaultRegistrar = defaultRegistrar_;
  }

  function registrarBeacon() external view returns (address) {
    return beacon;
  }

  /**
   Adds a new registrar to the set of authorized registrars.
   Only the contract owner or an already registered registrar may
   add new registrars.
   */
  function addRegistrar(uint256 rootDomainId, address registrar) external {
    require(
      _msgSender() == owner() || authorizedRegistrars[_msgSender()],
      "REE: Not Authorized"
    );

    require(!authorizedRegistrars[registrar], "ZH: Already Registered");

    authorizedRegistrars[registrar] = true;
    subdomainRegistrars[rootDomainId] = registrar;

    emit EENewSubdomainRegistrar(_msgSender(), rootDomainId, registrar);
  }

  function isController(address controller) external view returns (bool) {
    return controllers[controller];
  }

  function addController(address controller) external onlyOwner {
    require(!controllers[controller], "ZH: Already controller");
    controllers[controller] = true;
  }

  function removeController(address controller) external onlyOwner {
    require(controllers[controller], "ZH: Not a controller");
    controllers[controller] = false;
  }

  function getRegistrarForDomain(uint256 domainId)
    public
    view
    returns (IRegistrar)
  {
    address registrar = domainToContract[domainId];
    if (registrar == address(0)) {
      registrar = defaultRegistrar;
    }
    return IRegistrar(registrar);
  }

  function ownerOf(uint256 domainId) public view returns (address) {
    IRegistrar reg = getRegistrarForDomain(domainId);
    require(reg.domainExists(domainId), "ZH: Domain doesn't exist");
    return reg.ownerOf(domainId);
  }

  function domainExists(uint256 domainId) public view returns (bool) {
    IRegistrar reg = getRegistrarForDomain(domainId);
    return reg.domainExists(domainId);
  }

  // Used by registrars to emit transfer events so that we can pick it
  // up on subgraph
  function domainTransferred(
    address from,
    address to,
    uint256 tokenId
  ) external onlyRegistrar {
    emit EETransferV1(_msgSender(), from, to, tokenId);
  }

  function domainCreated(
    uint256 id,
    string calldata label,
    uint256 labelHash,
    uint256 parent,
    address minter,
    address controller,
    string calldata metadataUri,
    uint256 royaltyAmount,
    uint256 groupId,
    uint256 groupFileIndex
  ) external onlyRegistrar {
    emit EEDomainCreatedV3(
      _msgSender(),
      id,
      label,
      labelHash,
      parent,
      minter,
      controller,
      metadataUri,
      royaltyAmount,
      groupId,
      groupFileIndex
    );
    domainToContract[id] = _msgSender();
  }

  function metadataLockChanged(
    uint256 id,
    address locker,
    bool isLocked
  ) external onlyRegistrar {
    emit EEMetadataLockChanged(_msgSender(), id, locker, isLocked);
  }

  function metadataChanged(uint256 id, string calldata uri)
    external
    onlyRegistrar
  {
    emit EEMetadataChanged(_msgSender(), id, uri);
  }

  function royaltiesAmountChanged(uint256 id, uint256 amount)
    external
    onlyRegistrar
  {
    emit EERoyaltiesAmountChanged(_msgSender(), id, amount);
  }

  function domainGroupUpdated(
    uint256 folderGroupId,
    string calldata baseMetadataUri
  ) external onlyRegistrar {
    emit EEDomainGroupUpdatedV1(_msgSender(), folderGroupId, baseMetadataUri);
  }

  function refreshMetadata(uint256 startIndex, uint256 endIndex)
    external
    onlyOwner
  {
    emit EERefreshMetadata(startIndex, endIndex);
  }

  function owner()
    public
    view
    override(OwnableUpgradeable, IZNSHub)
    returns (address)
  {
    return super.owner();
  }

  function parentOf(uint256 domainId) external view returns (uint256) {
    IRegistrar registrar = getRegistrarForDomain(domainId);
    return registrar.parentOf(domainId);
  }
}
