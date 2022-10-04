// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import {IResourceRegistry} from "../interfaces/IResourceRegistry.sol";
import {IZNAResolver} from "../interfaces/IZNAResolver.sol";

contract MockResourceRegistry is IResourceRegistry {
  uint256 public immutable resourceType;

  IZNAResolver public immutable zNAResolver;

  uint256 public lastResourceID;
  mapping(uint256 => bool) public resourceMapping;

  /* -------------------------------------------------------------------------- */
  /*                                  Modifiers                                 */
  /* -------------------------------------------------------------------------- */

  /* -------------------------------------------------------------------------- */
  /*                                 Constructor                                */
  /* -------------------------------------------------------------------------- */

  constructor(uint256 _resourceType, IZNAResolver _zNAResolver) {
    resourceType = _resourceType;
    zNAResolver = _zNAResolver;
  }

  /* -------------------------------------------------------------------------- */
  /*                             External Functions                             */
  /* -------------------------------------------------------------------------- */

  function addResource(uint256 _zNA) external returns (uint256) {
    ++lastResourceID;
    resourceMapping[lastResourceID] = true;

    zNAResolver.associateWithResourceType(_zNA, resourceType, lastResourceID);
    return lastResourceID;
  }

  function addResourceExploit(uint256 _zNA, uint256 _resourceType)
    external
    returns (uint256)
  {
    ++lastResourceID;
    resourceMapping[lastResourceID] = true;

    zNAResolver.associateWithResourceType(_zNA, _resourceType, lastResourceID);
    return lastResourceID;
  }

  /* -------------------------------------------------------------------------- */
  /*                             Internal Functions                             */
  /* -------------------------------------------------------------------------- */

  /* -------------------------------------------------------------------------- */
  /*                               View Functions                               */
  /* -------------------------------------------------------------------------- */

  function resourceExists(uint256 _resourceID) external view returns (bool) {
    return resourceMapping[_resourceID];
  }
}
