// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

interface IRegistrar {
  // Emitted when a controller is removed
  event ControllerAdded(address indexed controller);

  // Emitted whenever a controller is removed
  event ControllerRemoved(address indexed controller);

  // Emitted whenever a new domain is created
  event DomainCreated(
    uint256 indexed id,
    string name,
    uint256 indexed nameHash,
    uint256 indexed parent
  );

  function domainExists(uint256 id) external view returns (bool);

  // Authorises a controller, who can register domains.
  function addController(address controller) external;

  // Revoke controller permission for an address.
  function removeController(address controller) external;

  // Whether or not a domain specific by an id is available.
  function available(uint256 id) external view returns (bool);

  function registerDomain(
    uint256 parent,
    string memory name,
    address domainOwner
  ) external;
}
