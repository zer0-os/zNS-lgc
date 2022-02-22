// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import {ContextUpgradeable} from "../oz/utils/ContextUpgradeable.sol";
import {ERC165Upgradeable} from "../oz/introspection/ERC165Upgradeable.sol";
import {OwnableUpgradeable} from "../oz/access/OwnableUpgradeable.sol";
import {IZNSHub} from "../interfaces/IZNSHub.sol";

contract ZNSHub is
  ContextUpgradeable,
  ERC165Upgradeable,
  OwnableUpgradeable,
  IZNSHub
{
  event EETransferV1(
    address registrar,
    address indexed from,
    address indexed to,
    uint256 indexed tokenId
  );

  event EEDomainCreatedV2(
    address registrar,
    uint256 indexed id,
    string label,
    uint256 indexed labelHash,
    uint256 indexed parent,
    address minter,
    address controller,
    string metadataUri,
    uint256 royaltyAmount
  );

  event EEMetadataLockChanged(
    address registrar,
    uint256 indexed id,
    address locker,
    bool isLocked
  );

  event EEMetadataChanged(address registrar, uint256 indexed id, string uri);

  event EERoyaltiesAmountChanged(
    address registrar,
    uint256 indexed id,
    uint256 amount
  );

  event EENewSubdomainRegistrar(
    address parentRegistrar,
    uint256 rootId,
    address childRegistrar
  );

  // Contains all zNS Registrars that are authentic
  mapping(address => bool) public authorizedRegistrars;

  // Contains all authorized global zNS controllers
  mapping(address => bool) public controllers;

  modifier onlyRegistrar() {
    require(
      authorizedRegistrars[_msgSender()],
      "REE: Not authorized registrar"
    );
    _;
  }

  function initialize() public initializer {
    __ERC165_init();
    __Context_init();
    __Ownable_init();
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

  // Used by registrars to emit transfer events so that we can pick it
  // up on subgraph
  function emitTransferEvent(
    address from,
    address to,
    uint256 tokenId
  ) external onlyRegistrar {
    emit EETransferV1(_msgSender(), from, to, tokenId);
  }

  function emitDomainCreatedEvent(
    uint256 id,
    string calldata label,
    uint256 labelHash,
    uint256 parent,
    address minter,
    address controller,
    string calldata metadataUri,
    uint256 royaltyAmount
  ) external onlyRegistrar {
    emit EEDomainCreatedV2(
      _msgSender(),
      id,
      label,
      labelHash,
      parent,
      minter,
      controller,
      metadataUri,
      royaltyAmount
    );
  }

  function emitMetadataLockChanged(
    uint256 id,
    address locker,
    bool isLocked
  ) external onlyRegistrar {
    emit EEMetadataLockChanged(_msgSender(), id, locker, isLocked);
  }

  function emitMetadataChanged(uint256 id, string calldata uri)
    external
    onlyRegistrar
  {
    emit EEMetadataChanged(_msgSender(), id, uri);
  }

  function emitRoyaltiesAmountChanged(uint256 id, uint256 amount)
    external
    onlyRegistrar
  {
    emit EERoyaltiesAmountChanged(_msgSender(), id, amount);
  }
}
