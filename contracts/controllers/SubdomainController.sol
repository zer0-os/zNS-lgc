// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import {Initializable} from "../oz/proxy/Initializable.sol";
import {ContextUpgradeable} from "../oz/utils/ContextUpgradeable.sol";
import {ERC165Upgradeable} from "../oz/introspection/ERC165Upgradeable.sol";
import {OwnableUpgradeable} from "../oz/access/OwnableUpgradeable.sol";

import "../interfaces/IRegistrar.sol";

contract SubdomainController is
  Initializable,
  ContextUpgradeable,
  ERC165Upgradeable,
  OwnableUpgradeable
{
  mapping(address => bool) public authorizedAccounts;

  modifier authorized(address registrar, uint256 parentId) {
    // Currently only authorized users are allowed to mint
    isAuthorized();
    _;
  }

  function initialize() public initializer {
    __Context_init();
    __ERC165_init();
    __Ownable_init();
  }

  function registerSubdomainExtended(
    address registrar,
    uint256 parentId,
    string memory label,
    address owner,
    string memory metadata
  ) external authorized(registrar, parentId) returns (uint256) {
    address minter = _msgSender();

    uint256 id = IRegistrar(registrar).registerDomainAndSend(
      parentId,
      label,
      minter,
      metadata,
      0,
      true,
      owner
    );

    return id;
  }

  function registerSubdomainContractExtended(
    address registrar,
    uint256 parentId,
    string memory label,
    address owner,
    string memory metadata
  ) external authorized(registrar, parentId) returns (uint256) {
    address minter = _msgSender();

    uint256 id = IRegistrar(registrar).registerSubdomainContract(
      parentId,
      label,
      minter,
      metadata,
      0,
      true,
      owner
    );

    return id;
  }

  function isAuthorized() private view {
    require(
      authorizedAccounts[_msgSender()] || _msgSender() == owner(),
      "ZC: Not Authorized"
    );
  }
}
