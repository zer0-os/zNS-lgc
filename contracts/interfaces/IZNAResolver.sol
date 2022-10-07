// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IResourceRegistry} from "./IResourceRegistry.sol";

interface IZNAResolver {
  /* -------------------------------------------------------------------------- */
  /*                                   Events                                   */
  /* -------------------------------------------------------------------------- */

  event ResourceAssociated(
    uint256 zNA,
    uint256 resourceType,
    uint256 resourceID
  );

  event ResourceDisassociated(
    uint256 zNA,
    uint256 oldResourceType,
    uint256 oldResourceID
  );

  event ResourceRegistryAdded(uint256 resourceType, address resourceRegistry);

  event ResourceRegistryRemoved(
    uint256 oldResourceType,
    address oldResourceRegistry
  );

  /* -------------------------------------------------------------------------- */
  /*                             External Functions                             */
  /* -------------------------------------------------------------------------- */

  function associateWithResourceType(
    uint256 zNA,
    uint256 resourceType,
    uint256 resourceID
  ) external;

  function disassociateWithResourceType(uint256 zNA, uint256 resourceType)
    external;

  function addResourceRegistry(
    uint256 resourceType,
    IResourceRegistry resourceRegistry
  ) external;

  function removeResourceRegistry(uint256 resourceType) external;

  /* -------------------------------------------------------------------------- */
  /*                               View Functions                               */
  /* -------------------------------------------------------------------------- */

  function hasResourceType(uint256 zNA, uint256 resourceType)
    external
    view
    returns (bool);

  function resourceTypes(uint256 zNA) external view returns (uint256);

  function resourceID(uint256 zNA, uint256 resourceType)
    external
    view
    returns (uint256);

  function resourceRegistry(uint256 resourceType)
    external
    view
    returns (IResourceRegistry);
}
