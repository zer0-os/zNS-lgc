// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

// Following file examples here
// https://github.com/OffchainLabs/arbitrum-tutorials/tree/master/packages/greeter
//
// Following documentation here
// https://developer.offchainlabs.com/docs/l1_l2_messages#demo

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract Greeter is OwnableUpgradeable {
  string greeting;

  function __Greeter_init(string calldata _greeting) public initializer {
    greeting = _greeting;
  }

  function setGreeeting(string calldata _greeting) public onlyOwner {
    greeting = _greeting;
  }
}
