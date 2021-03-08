// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Registry is Ownable {
  // Logged when the owner of a node assigns a new owner to a subnode.
  event NewOwner(bytes32 indexed node, bytes32 indexed label, address owner);

  struct DomainRecord {
    address owner;
  }

  mapping(bytes32 => DomainRecord) public records;

  constructor() {
    records[0x0].owner = msg.sender;
  }

  function owner(bytes32 node) public view returns (address) {
    address domainOwner = records[node].owner;
    return domainOwner;
  }

  function setSubnodeRecord(
    bytes32 node,
    bytes32 label,
    address domainOwner
  ) public {
    setSubnodeOwner(node, label, domainOwner);
  }

  function recordExists(bytes32 node) external view returns (bool) {
    address domainOwner = records[node].owner;
    bool hasDomainOwner = domainOwner != address(0x0);
    return hasDomainOwner;
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
