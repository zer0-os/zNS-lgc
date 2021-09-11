// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/utils/introspection/IERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";

interface IBasicController is IERC165Upgradeable, IERC721ReceiverUpgradeable {
  event RegisteredDomain(
    string name,
    uint256 indexed id,
    uint256 indexed parent,
    address indexed owner,
    address minter
  );

  /**
    @notice Registers a new top level domain
    @param domain The name of the domain
    @param owner Who the owner of the domain should be
   */
  function registerDomain(string memory domain, address owner) external;

  /**
    @notice Registers a new sub domain
    @param parentId The id of the parent domain
    @param label The name of the sub domain
    @param owner The owner of the new sub domain 
 */
  function registerSubdomain(
    uint256 parentId,
    string memory label,
    address owner
  ) external;
}
