// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol";

contract BasicController is
  Initializable,
  ContextUpgradeable,
  ERC165Upgradeable
{
  function initialize() public initializer {
    __ERC165_init();
    __Context_init();
  }
}
