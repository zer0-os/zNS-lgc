// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IRegistrar is IERC721 {
  // Emitted when a controller is removed
  event ControllerAdded(address indexed controller);

  // Emitted whenever a controller is removed
  event ControllerRemoved(address indexed controller);

  // Emitted whenever a new name is registered
  event NameRegistered(uint256 indexed id, address indexed owner);

  // Authorises a controller, who can register domains.
  function addController(address controller) external;

  // Revoke controller permission for an address.
  function removeController(address controller) external;

  // Whether or not a domain specific by an id is available.
  function available(uint256 id) external view returns (bool);

  // Used by controller to register a new domain via id.
  function register(uint256 id, address owner) external returns (uint256);
}
