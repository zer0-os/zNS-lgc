// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721HolderUpgradeable.sol";

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
  uint256 controllerAdmin; // not writeable - can mint a domain at any level in zNS

  modifier authorized(uint256 domain) {
    require(
      registrar.ownerOf(domain) == _msgSender() ||
      registrar.ownerOf(domain) == controllerAdmin,
      "Zer0 Controller: Not Authorized"
    );
    _;
  }

  function initialize(IRegistrar _registrar, uint256 _controllerAdmin) public initializer {
    __ERC165_init();
    __Context_init();
    __ERC721Holder_init();

    registrar = _registrar;
    controllerAdmin = _controllerAdmin;
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

    uint256 id = registrar.registerDomain(
      parentId,
      label,
      minter,
      owner,
      metadata,
      royaltyAmount,
      lockOnCreation
    );

    emit RegisteredDomain(label, id, parentId, owner, minter);

    return id;
  }
}
