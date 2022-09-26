// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IResourceRegistry {
  function resourceExists(uint256 _resourceID) external view returns (bool);
}
