pragma solidity ^0.7.3;

interface ZNSController {
  // Emitted whenever a new name is registered
  event NameRegistered(bytes32 indexed parent, string name, bytes32 indexed label, address indexed owner);
}
