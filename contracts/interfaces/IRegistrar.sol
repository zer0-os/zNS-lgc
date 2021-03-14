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
    uint256 indexed parent,
    address creator,
    address controller
  );

  // Emitted whenever the metadata of a domain is locked
  event MetadataLocked(uint256 indexed id, address locker);

  // Emitted whenever the metadata of a domain is unlocked
  event MetadataUnlocked(uint256 indexed id);

  // Emitted whenever the metadata of a domain is changed
  event MetadataChanged(uint256 indexed id, string uri);

  // Emitted whenever the royalty amount is changed
  event RoyaltiesAmountChanged(uint256 indexed id, uint256 amount);

  // Authorises a controller, who can register domains.
  function addController(address controller) external;

  // Revoke controller permission for an address.
  function removeController(address controller) external;

  // Registers a new sub domain
  function registerDomain(
    uint256 parent,
    string memory name,
    address domainOwner,
    address creator
  ) external;

  // Lock a domains metadata from being modified, can only be called by domain owner and if the metadata is unlocked
  function lockDomainMetadata(uint256 id) external;

  // Unlocks a domains metadata, can only be called by the address that locked the metadata
  function unlockDomainMetadata(uint256 id) external;

  // Sets a domains metadata uri
  function setDomainMetadataUri(uint256 id, string memory uri) external;

  // Sets the asked royalty amount on a domain (amount is a percentage with 5 decimal places)
  function setDomainRoyaltyAmount(uint256 id, uint256 amount) external;

  // Checks whether or not a domain exists
  function domainExists(uint256 id) external view returns (bool);

  // Whether or not a domain specific by an id is available.
  function available(uint256 id) external view returns (bool);

  // Returns the original creator of a domain
  function creatorOf(uint256 id) external view returns (address);

  // Checks if a domains metadata is locked
  function domainMetadataLocked(uint256 id) external view returns (bool);

  // Returns the address which locked the domain metadata
  function domainMetadataLockedBy(uint256 id) external view returns (address);

  // Gets the controller that registered a domain
  function domainController(uint256 id) external view returns (address);

  // Gets a domains current royalty amount
  function domainRoyaltyAmount(uint256 id) external view returns (uint256);
}
