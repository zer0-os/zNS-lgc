// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "./oz/proxy/Initializable.sol";
import "./oz/utils/ContextUpgradeable.sol";
import "./oz/introspection/ERC165Upgradeable.sol";
import "./oz/token/ERC721/ERC721HolderUpgradeable.sol";

import "./interfaces/IBasicController.sol";
import "./interfaces/IRegistrar.sol";

contract BasicController is
  IBasicController,
  ContextUpgradeable,
  ERC165Upgradeable,
  ERC721HolderUpgradeable
{
  IRegistrar private registrar;
  uint256 rootDomain; // for upgrade reasons

  modifier authorized(uint256 domain) {
    require(
      registrar.ownerOf(domain) == _msgSender(),
      "Zer0 Controller: Not Authorized"
    );
    _;
  }

  function initialize(IRegistrar _registrar) public initializer {
    __ERC165_init();
    __Context_init();
    __ERC721Holder_init();

    registrar = _registrar;
  }

  function registerSubdomainExtended(
    uint256 parentId,
    string memory label,
    address owner,
    string memory metadata,
    uint256 royaltyAmount,
    bool lockOnCreation
  ) external override authorized(parentId) returns (uint256) {
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
}
