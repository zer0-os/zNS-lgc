// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

interface IRegistry {
  // Logged when the owner of a node assigns a new owner to a subnode.
  event NewOwner(bytes32 indexed node, bytes32 indexed label, address owner);

  // Logged when the owner of a node transfers ownership to a new account.
  event Transfer(bytes32 indexed node, address owner);

  function setSubnodeRecord(
    bytes32 node,
    bytes32 label,
    address owner,
    address resolver,
    uint64 ttl
  ) external;

  function setOwner(bytes32 node, address owner) external;

  function owner() external view returns (address);

  function owner(bytes32 node) external view returns (address);

  function recordExists(bytes32 node) external view returns (bool);
}
