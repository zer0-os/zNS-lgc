pragma solidity ^0.7.3;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface ZNSRegistrar is IERC721 {
  // Emitted when a controller is removed
  event ControllerAdded(address indexed controller);
  // Emitted whenever a controller is removed
  event ControllerRemoved(address indexed controller);
  // Emitted whenever a new name is registered
  event NameRegistered(uint256 indexed id, address indexed owner);

  // Authorises a controller, who can register and renew domains.
  function addController(address controller) external virtual;

  // Revoke controller permission for an address.
  function removeController(address controller) external virtual;

  function available(uint256 id) public view virtual returns (bool);

  // Used by controller to register a new domain
  function register(uint256 id, address owner) external virtual returns (uint256);
}
