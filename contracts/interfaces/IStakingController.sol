// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "@openzeppelin/contracts-upgradeable/introspection/IERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";

interface IStakingController is IERC165Upgradeable, IERC721ReceiverUpgradeable {
  event DomainBidPlaced(
  uint256 indexed parentId,
  uint256 indexed bidIdentifier,
  uint256 bidAmount,
  string indexed name,
  address bidder
  );

  event DomainBidApproved(string bidIdentifier);

  event DomainBidFulfilled(
    string indexed bidIdentifier,
    string name,
    address recipient,
    uint256 indexed domainId,
    uint256 indexed parentID
  );

  event BidWithdrawn(string indexed bidIdentifier);

  /**
    @notice placeDomainBid allows a user to send a request for a new sub domain to a domains owner
    @param parentId is the id number of the parent domain to the sub domain being requested
    @param bidAmount is the uint value of the amount of infinity bid
    @param name is the name of the new domain being created
  **/
  function placeDomainBid(
    uint256 parentId,
    uint256 bidAmount,
    string memory name
  ) external;

  /**
    @notice approveDomainBid approves a domain bid, allowing the domain to be created.
    @param parentId is the id number of the parent domain to the sub domain being requested
    @param bidIdentifier is the number representing the bid being accepted
  **/
  function approveDomainBid(
    uint256 parentId,
    uint256 bidIdentifier
  ) external;

  /**
    @notice Fulfills a domain bid, creating the domain.
      Transfers tokens from bidders wallet into controller.
    @param bidId is the id number of the bid being fullfilled
    @param royaltyAmount is the royalty amount the creator sets for resales on zAuction
    @param metadata is the IPFS hash of the new domains information
    @param lockOnCreation is a bool representing whether or not the metadata for this domain is locked
  **/
  function fulfillDomainBid(
    uint256 bidId,
    uint256 royaltyAmount,
    string memory metadata,
    bool lockOnCreation
  ) external;

  /**
    @notice withdrawBid allows a bidder to withdraw a placed bid should they change their mind
    @param bidIdentifier is the number representing the bid being withdrawn
  **/
  function withdrawBid(
    uint256 bidIdentifier
  ) external;

  /**
    @notice relenquishOwnership allows a domain owner to relenquish
            ownership of a domain they own
    @param tokenId is the tokenId of the domain being relenquished
  **/
  function relenquishOwnership(
    uint256 tokenId
  ) external;

}
