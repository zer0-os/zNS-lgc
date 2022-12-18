// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import {IOperatorFilterRegistry} from "../opensea/IOperatorFilterRegistry.sol";

library OperatorFiltererLib {
  error OperatorNotAllowed(address operator);

  IOperatorFilterRegistry public constant OPERATOR_FILTER_REGISTRY =
    IOperatorFilterRegistry(0x000000000000AAeB6D7670E522A718067333cd4E);

  function initializeFilter(
    address registrant,
    address subscriptionOrRegistrantToCopy,
    bool subscribe
  ) public {
    // If an inheriting token contract is deployed to a network without the registry deployed, the modifier
    // will not revert, but the contract will need to be registered with the registry once it is deployed in
    // order for the modifier to filter addresses.
    if (subscribe) {
      OPERATOR_FILTER_REGISTRY.registerAndSubscribe(
        registrant,
        subscriptionOrRegistrantToCopy
      );
    } else {
      if (subscriptionOrRegistrantToCopy != address(0)) {
        OPERATOR_FILTER_REGISTRY.registerAndCopyEntries(
          registrant,
          subscriptionOrRegistrantToCopy
        );
      } else {
        OPERATOR_FILTER_REGISTRY.register(registrant);
      }
    }
  }

  function onlyAllowedOperator(
    address registrant,
    address msgSender,
    address from
  ) public view {
    // Allow spending tokens from addresses with balance
    // Note that this still allows listings and marketplaces with escrow to transfer tokens if transferred
    // from an EOA.
    if (from == msgSender) {
      return;
    }
    if (!OPERATOR_FILTER_REGISTRY.isOperatorAllowed(registrant, msgSender)) {
      revert OperatorNotAllowed(msgSender);
    }
  }

  function onlyAllowedOperatorApproval(
    address registrant,
    address operator
  ) public view {
    if (!OPERATOR_FILTER_REGISTRY.isOperatorAllowed(registrant, operator)) {
      revert OperatorNotAllowed(operator);
    }
  }
}
