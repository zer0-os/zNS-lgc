// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "../oz/proxy/Initializable.sol";
import "../oz/utils/ContextUpgradeable.sol";
import "../oz/introspection/ERC165Upgradeable.sol";

import "../interfaces/IBasicController.sol";
import "../interfaces/IRegistrar.sol";

contract SubdomainController is ContextUpgradeable, ERC165Upgradeable {
  modifier authorized(IRegistrar registrar, uint256 domain) {
    require(
      registrar.ownerOf(domain) == _msgSender(),
      "Zer0 Controller: Not Authorized"
    );
    _;
  }

  function initialize() public initializer {
    __ERC165_init();
    __Context_init();
  }

  function registerSubdomainExtended(
    IRegistrar registrar,
    uint256 parentId,
    string memory label,
    address owner,
    string memory metadata,
    uint256 royaltyAmount,
    bool lockOnCreation
  ) external authorized(registrar, parentId) returns (uint256) {
    address minter = _msgSender();

    uint256 id = registrar.registerDomainAndSend(
      parentId,
      label,
      minter,
      metadata,
      royaltyAmount,
      lockOnCreation,
      owner
    );

    return id;
  }

  function registerSubdomainContractExtended(
    IRegistrar registrar,
    uint256 parentId,
    string memory label,
    address owner,
    string memory metadata,
    uint256 royaltyAmount,
    bool lockOnCreation
  ) external authorized(registrar, parentId) returns (uint256) {
    address minter = _msgSender();

    uint256 id = registrar.registerSubdomainContract(
      parentId,
      label,
      minter,
      metadata,
      royaltyAmount,
      lockOnCreation,
      owner
    );

    return id;
  }
}
