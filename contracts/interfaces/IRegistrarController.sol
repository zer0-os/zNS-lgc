// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

interface IRegistrarController {
  // Emitted whenever a new name is registered (parent domain id, new domain label, new domain label hash, owner address)
  event NameRegistered(
    bytes32 indexed parent,
    string name,
    bytes32 indexed label,
    address indexed owner
  );
}
