// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

interface IRegistry {
  // Logged when the owner of a node assigns a new owner to a subnode.
  event NewOwner(uint256 indexed node, uint256 indexed label, address owner);

  // Logged when the owner of a node transfers ownership to a new account.
  event Transfer(uint256 indexed node, address owner);

  function setSubnodeRecord(
    uint256 node,
    uint256 label,
    address owner
  ) external;

  function setOwner(uint256 node, address owner) external;

  function owner(uint256 node) external view returns (address);

  function recordExists(uint256 node) external view returns (bool);
}
