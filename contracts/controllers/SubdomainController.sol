// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "../oz/proxy/Initializable.sol";
import "../oz/utils/ContextUpgradeable.sol";
import "../oz/introspection/ERC165Upgradeable.sol";

import "../interfaces/IRegistrar.sol";

contract SubdomainController is ContextUpgradeable, ERC165Upgradeable {
  modifier authorized(address registrar, uint256 domain) {
    require(
      IRegistrar(registrar).ownerOf(domain) == _msgSender(),
      "Zer0 Controller: Not Authorized"
    );
    _;
  }

  function initialize() public initializer {
    __ERC165_init();
    __Context_init();
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
}
