// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IResourceRegistry} from "./IResourceRegistry.sol";

interface IZNAResolver {
  /* -------------------------------------------------------------------------- */
  /*                                   Events                                   */
  /* -------------------------------------------------------------------------- */

  event ResourceAssociated(
    uint256 _zNA,
    uint256 _resourceType,
    uint256 _resourceID
  );

  event ResourceAssociationUpdated(
    uint256 _zNA,
    uint256 _resourceType,
    uint256 _resourceID
  );

  event ResourceDisassociated(uint256 _zNA, uint256 _resourceType);

  event ResourceRegistryAdded(uint256 _resourceType, address _resourceRegistry);

  /* -------------------------------------------------------------------------- */
  /*                             External Functions                             */
  /* -------------------------------------------------------------------------- */

  function associateWithResourceType(
    uint256 _zNA,
    uint256 _resourceType,
    uint256 _resourceID
  ) external;

  function updateResourceIDWithResourceType(
    uint256 _zNA,
    uint256 _resourceType,
    uint256 _resourceID
  ) external;

  function disassociateWithResourceType(uint256 _zNA, uint256 _resourceType)
    external;

  function addResourceRegistry(
    uint256 _resourceType,
    IResourceRegistry _resourceRegistry
  ) external;

  /* -------------------------------------------------------------------------- */
  /*                               View Functions                               */
  /* -------------------------------------------------------------------------- */

  function hasResourceType(uint256 _zNA, uint256 _resourceType)
    external
    view
    returns (bool);

  function resourceTypes(uint256 _zNA) external view returns (uint256);

  function resourceID(uint256 _zNA, uint256 _resourceType)
    external
    view
    returns (uint256);

  function resourceRegistry(uint256 _resourceType)
    external
    view
    returns (IResourceRegistry);
}
