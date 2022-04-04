// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../oz/introspection/IERC165Upgradeable.sol";
import "../oz/token/ERC721/IERC721ReceiverUpgradeable.sol";

interface IBasicController is IERC165Upgradeable, IERC721ReceiverUpgradeable {
  event RegisteredDomain(
    string name,
    uint256 indexed id,
    uint256 indexed parent,
    address indexed owner,
    address minter
  );

  /**
    @notice Registers a new sub domain
    @param parentId The id of the parent domain
    @param label The name of the sub domain
    @param owner The owner of the new sub domain 
    @param metadata The metadata uri to set
    @param royaltyAmount Amount of royalties
    @param lockOnCreation Should the domain be locked
 */
  function registerSubdomainExtended(
    uint256 parentId,
    string memory label,
    address owner,
    string memory metadata,
    uint256 royaltyAmount,
    bool lockOnCreation
  ) external returns (uint256);
}
