// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol";

import "./interfaces/IRegistrar.sol";

contract BasicController is
  Initializable,
  ContextUpgradeable,
  ERC165Upgradeable
{
  IRegistrar private registrar;
  uint256 private rootDomain;

  event RegisteredDomain(
    string name,
    uint256 indexed id,
    address indexed owner,
    address indexed creator
  );

  event RegisteredSubdomain(
    string name,
    uint256 indexed id,
    uint256 indexed parent,
    address indexed owner,
    address creator
  );

  modifier authorized(uint256 domain) {
    require(registrar.domainExists(domain), "Invalid Domain");
    require(registrar.ownerOf(domain) == _msgSender(), "Not Authorized");
    _;
  }

  function initialize(IRegistrar _registrar) public initializer {
    __ERC165_init();
    __Context_init();

    registrar = _registrar;
    rootDomain = 0x0;
  }

  function registerDomain(string memory domain, address owner)
    external
    authorized(rootDomain)
  {
    address creator = _msgSender();
    uint256 id = registrar.registerDomain(rootDomain, domain, owner, creator);

    emit RegisteredDomain(domain, id, owner, creator);
  }

  function registerSubdomain(
    uint256 parent,
    string memory label,
    address owner
  ) external authorized(parent) {
    address creator = _msgSender();
    uint256 id = registrar.registerDomain(parent, label, owner, creator);

    emit RegisteredSubdomain(label, id, parent, owner, creator);
  }
}
