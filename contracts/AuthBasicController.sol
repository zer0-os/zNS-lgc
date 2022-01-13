// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./interfaces/IBasicController.sol";
import "./interfaces/IRegistrar.sol";

contract BasicController is
  IBasicController,
  ContextUpgradeable,
  ERC165Upgradeable,
  ERC721HolderUpgradeable,
  OwnableUpgradeable
{
  IRegistrar private registrar;

  modifier authorized() {
    require(owner() == _msgSender(), "Zer0 Controller: Not Authorized");
    _;
  }

  function initialize(IRegistrar _registrar) public initializer {
    __ERC165_init();
    __Context_init();
    __ERC721Holder_init();
    __Ownable_init();

    registrar = _registrar;
  }

  function registerSubdomainExtended(
    uint256 parentId,
    string memory label,
    address owner,
    string memory metadata,
    uint256 royaltyAmount,
    bool lockOnCreation
  ) external override authorized returns (uint256) {
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
