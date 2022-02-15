// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import {ContextUpgradeable} from "../oz/utils/ContextUpgradeable.sol";
import {ERC165Upgradeable} from "../oz/introspection/ERC165Upgradeable.sol";
import {OwnableUpgradeable} from "../oz/access/OwnableUpgradeable.sol";
import {IEventEmitter} from "../interfaces/IEventEmitter.sol";

contract RegistrarEventEmitter is
  ContextUpgradeable,
  ERC165Upgradeable,
  OwnableUpgradeable,
  IEventEmitter
{
  event RegistrarAdded(address registrar);

  event EETransferV1(
    address registrar,
    address indexed from,
    address indexed to,
    uint256 indexed tokenId
  );

  event EEDomainCreatedV2(
    address registrar,
    uint256 indexed id,
    string name,
    uint256 indexed nameHash,
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

  // Contains all zNS Registrars that are authentic
  mapping(address => bool) public authorizedRegistrars;

  modifier onlyRegistrar() {
    require(authorizedRegistrars[_msgSender()], "Not authorized registrar");
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
  function addRegistrar(address registrar) external {
    require(
      _msgSender() == owner() || authorizedRegistrars[_msgSender()],
      "Not Authorized"
    );

    emit RegistrarAdded(registrar);

    authorizedRegistrars[registrar] = true;
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
    string calldata name,
    uint256 nameHash,
    uint256 parent,
    address minter,
    address controller,
    string calldata metadataUri,
    uint256 royaltyAmount
  ) external onlyRegistrar {
    emit EEDomainCreatedV2(
      _msgSender(),
      id,
      name,
      nameHash,
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
