// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {IOperatorFilterRegistry} from "./IOperatorFilterRegistry.sol";

contract OperatorFilterer {
  error OperatorNotAllowed(address operator);

  IOperatorFilterRegistry constant operatorFilterRegistry =
    IOperatorFilterRegistry(0x000000000000AAeB6D7670E522A718067333cd4E);

  function initializeFilter() internal {
    // If an inheriting token contract is deployed to a network without the registry deployed, the modifier
    // will not revert, but the contract will need to be registered with the registry once it is deployed in
    // order for the modifier to filter addresses.
    operatorFilterRegistry.registerAndSubscribe(
      address(this),
      address(0x3cc6CddA760b79bAfa08dF41ECFA224f810dCeB6)
    );
  }

  modifier onlyAllowedOperator() virtual {
    // Check registry code length to facilitate testing in environments without a deployed registry.
    if (address(operatorFilterRegistry).code.length > 0) {
      if (
        !operatorFilterRegistry.isOperatorAllowed(address(this), msg.sender)
      ) {
        revert OperatorNotAllowed(msg.sender);
      }
    }
    _;
  }
}
