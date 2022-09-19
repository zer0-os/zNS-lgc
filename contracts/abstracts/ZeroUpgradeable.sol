// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "hardhat/console.sol";
import {Initializable} from "../oz-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "../oz-upgradeable/access/OwnableUpgradeable.sol";
import {AccessControlUpgradeable} from "../oz-upgradeable/access/AccessControlUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "../oz-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "../oz-upgradeable/security/PausableUpgradeable.sol";
import {UUPSUpgradeable} from "../oz-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ContextUpgradeable} from "../oz-upgradeable/utils/ContextUpgradeable.sol";
import {AddressUpgradeable} from "../oz-upgradeable/utils/AddressUpgradeable.sol";
import {SafeMathUpgradeable} from "../oz-upgradeable/utils/math/SafeMathUpgradeable.sol";

abstract contract ZeroUpgradeable is
  Initializable,
  OwnableUpgradeable,
  AccessControlUpgradeable,
  ReentrancyGuardUpgradeable,
  PausableUpgradeable,
  UUPSUpgradeable
{
  using AddressUpgradeable for address;
  using SafeMathUpgradeable for uint256;

  uint256 public version;

  /// @custom:oz-upgrades-unsafe-allow constructor
  function __ZeroUpgradeable_init() internal onlyInitializing {
    __Ownable_init();
    __AccessControl_init();
    __ReentrancyGuard_init();
    __Pausable_init();
    __UUPSUpgradeable_init();
    version = 1;
    console.log("v", version);
  }

  function _authorizeUpgrade(address newImplementation)
    internal
    override
    onlyOwner
  {}
}