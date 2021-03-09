// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721Pausable.sol";
import "./interfaces/IZNSRegistrar.sol";

contract ZNSRegistrar is IZNSRegistrar, Ownable, ERC721Pausable {
  modifier onlyController {
    require(controllers[msg.sender]);
    _;
  }

  constructor() ERC721("Zer0 Name Service", "ZNS") {
    _safeMint(msg.sender, 0);
  }

  // A map of addresses that are authorised to register and renew names.
  mapping(address => bool) public controllers;

  // Authorises a controller
  function addController(address controller) external override onlyOwner {
    controllers[controller] = true;
    emit ControllerAdded(controller);
  }

  // Revoke controller permission for an address.
  function removeController(address controller) external override onlyOwner {
    controllers[controller] = false;
    emit ControllerRemoved(controller);
  }

  function available(uint256 id) external view override returns (bool) {
    bool notRegistered = !_exists(id);
    return notRegistered;
  }

  function domainExists(uint256 id) external view override returns (bool) {
    bool domainNftExists = _exists(id);
    return domainNftExists;
  }

  /**
    @notice Registers a new (sub) domain
    @param parent The parent domain
    @param name The name of the domain
    @param domainOwner the owner of the new domain
   */
  function registerDomain(
    uint256 parent,
    string memory name,
    address domainOwner
  ) external override onlyController {
    // Create the child domain under the parent domain
    uint256 labelHash = uint256(keccak256(bytes(name)));
    uint256 domainId = _createDomain(parent, labelHash, domainOwner);

    emit DomainCreated(domainId, name, labelHash, parent);
  }

  function _createDomain(
    uint256 parent,
    uint256 label,
    address domainOwner
  ) internal returns (uint256) {
    // Domain parents must exist
    require(_exists(parent), "Non-existant Parent Domain");

    // Calculate what the new domain id is and mint it
    uint256 domainId = uint256(keccak256(abi.encodePacked(parent, label)));
    _safeMint(domainOwner, domainId);

    return domainId;
  }
}
