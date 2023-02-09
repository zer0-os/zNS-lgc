// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import {BeaconProxy} from "../oz/proxy/beacon/BeaconProxy.sol";

library CreateProxyLib {
  function createBeaconProxy(
    address beacon,
    bytes memory data
  ) public returns (address payable) {
    return
      payable(
        address(
          new BeaconProxy{
            salt: keccak256(abi.encodePacked(block.number, data))
          }(beacon, data)
        )
      );
  }
}
