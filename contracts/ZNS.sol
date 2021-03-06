pragma solidity ^0.7.3;

interface ZNS {
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
  ) external virtual;

  function setOwner(bytes32 node, address owner) external virtual;

  function owner(bytes32 node) external view virtual returns (address);

  function recordExists(bytes32 node) external view virtual returns (bool);
}
