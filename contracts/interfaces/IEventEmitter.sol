// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

interface IEventEmitter {
  function addRegistrar(uint256 rootDomainId, address registrar) external;

  function emitTransferEvent(
    address from,
    address to,
    uint256 tokenId
  ) external;

  function emitDomainCreatedEvent(
    uint256 id,
    string calldata name,
    uint256 nameHash,
    uint256 parent,
    address minter,
    address controller,
    string calldata metadataUri,
    uint256 royaltyAmount
  ) external;

  function emitMetadataLockChanged(
    uint256 id,
    address locker,
    bool isLocked
  ) external;

  function emitMetadataChanged(uint256 id, string calldata uri) external;

  function emitRoyaltiesAmountChanged(uint256 id, uint256 amount) external;
}
