// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IRegistry.sol";

contract Registry is Ownable, IRegistry {
  struct DomainRecord {
    address owner;
  }

  mapping(uint256 => DomainRecord) public records;

  modifier authorized(uint256 node) {
    address domainOwner = records[node].owner;
    require(domainOwner == msg.sender, "Not Authorized.");
    _;
  }

  constructor() {
    records[0x0].owner = msg.sender;
  }

  function setSubnodeRecord(
    uint256 node,
    uint256 label,
    address domainOwner
  ) external override {
    setSubnodeOwner(node, label, domainOwner);
  }

  function owner(uint256 node) public view override returns (address) {
    address domainOwner = records[node].owner;
    return domainOwner;
  }

  function recordExists(uint256 node) public view override returns (bool) {
    address domainOwner = records[node].owner;
    bool hasDomainOwner = domainOwner != address(0x0);
    return hasDomainOwner;
  }

  function setOwner(uint256 node, address domainOwner)
    public
    override
    authorized(node)
  {
    _setOwner(node, domainOwner);
    emit Transfer(node, domainOwner);
  }

  function setSubnodeOwner(
    uint256 node,
    uint256 label,
    address domainOwner
  ) public onlyOwner returns (uint256) {
    uint256 subnode = uint256(keccak256(abi.encodePacked(node, label)));
    _setOwner(subnode, domainOwner);
    emit NewOwner(node, label, domainOwner);
    return subnode;
  }

  function _setOwner(uint256 node, address domainOwner) private {
    records[node].owner = domainOwner;
  }
}
