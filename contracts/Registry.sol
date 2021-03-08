// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Registry is Ownable {
  // Logged when the owner of a node assigns a new owner to a subnode.
  event NewOwner(bytes32 indexed node, bytes32 indexed label, address owner);

  // Logged when the owner of a node transfers ownership to a new account.
  event Transfer(bytes32 indexed node, address owner);

  struct DomainRecord {
    address owner;
  }

  mapping(bytes32 => DomainRecord) public records;

  modifier authorized(bytes32 node) {
    address domainOwner = records[node].owner;
    require(domainOwner == msg.sender, "Not Authorized.");
    _;
  }

  constructor() {
    records[0x0].owner = msg.sender;
  }

  function setSubnodeRecord(
    bytes32 node,
    bytes32 label,
    address domainOwner
  ) external {
    setSubnodeOwner(node, label, domainOwner);
  }

  function owner(bytes32 node) public view returns (address) {
    address domainOwner = records[node].owner;
    return domainOwner;
  }

  function recordExists(bytes32 node) public view returns (bool) {
    address domainOwner = records[node].owner;
    bool hasDomainOwner = domainOwner != address(0x0);
    return hasDomainOwner;
  }

  function setOwner(bytes32 node, address domainOwner) public authorized(node) {
    _setOwner(node, domainOwner);
    emit Transfer(node, domainOwner);
  }

  function setSubnodeOwner(
    bytes32 node,
    bytes32 label,
    address domainOwner
  ) public onlyOwner returns (bytes32) {
    bytes32 subnode = keccak256(abi.encodePacked(node, label));
    _setOwner(subnode, domainOwner);
    emit NewOwner(node, label, domainOwner);
    return subnode;
  }

  function _setOwner(bytes32 node, address domainOwner) private {
    records[node].owner = domainOwner;
  }
}
