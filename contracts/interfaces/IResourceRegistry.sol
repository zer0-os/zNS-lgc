// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IResourceRegistry {
  function resourceExists(uint256 _resoureceID) external view returns (bool);
}
