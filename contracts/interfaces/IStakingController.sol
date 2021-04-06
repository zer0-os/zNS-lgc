// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "@openzeppelin/contracts-upgradeable/introspection/IERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";

interface IStakingController is IERC165Upgradeable, IERC721ReceiverUpgradeable {
  event DomainBidPlaced(
    bytes32 indexed requestHash,
    bytes32 indexed ipfsHash
  );

  event DomainBidAccepted(string bidIdentifier);

  event DomainBidFulfilled(string bidIdentifier);

  /**
    @notice placeDomainBid allows a user to send a request for a new sub domain to a domains owner
    @param requestHash is the hashed data for a domain request
    @param ipfsHash is the IPFS hash containing the bids params(ex: name being requested, amount, stc)
    @dev the IPFS hash must be emitted as a string here for the front end to be able to recover the bid info
  **/
  function placeDomainBid(
    bytes32 requestHash,
    string memory ipfsHash
  ) external;

  /**
    @notice approveDomainBid Approves a domain bid, allowing the domain to be created.
      Will emit a DomainBidAccepted event.
    @param parentId is the id number of the parent domain to the sub domain being requested
    @param ipfsHash is the IPFS hash of the bids information
    @param bidder is the address of the account that placed the bid being accepted
  **/
  function approveDomainBid(
    uint256 parentId,
    string memory ipfsHash,
    address bidder
  ) external;

  /**
    @notice Fulfills a domain bid, creating the domain.
      Transfers tokens from bidders wallet into controller.
    @param parentId is the id number of the parent domain to the sub domain being requested
    @param bidAmount is the uint value of the amount of infinity bid
    @param royaltyAmount is the royalty amount the creator sets for resales on zAuction
    @param metadata is the IPFS hash of the new domains information
    @dev this is the same IPFS hash that contains the bids information as this is just stored on its own feild in the metadata
    @param name is the name of the new domain being created
    @param signature is the signature of the bidder
    @param lockOnCreation is a bool representing whether or not the metadata for this domain is locked
  **/
    function fulfillDomainBid(
      uint256 parentId,
      uint256 bidAmount,
      uint256 royaltyAmount,
      string memory metadata,
      string memory name,
      bytes memory signature,
      bool lockOnCreation
    ) external;

  /**
    @notice recover allows the hashed data of a domain request to be recovered
    @notice requestHash is the hash of the request being recovered
    @notice signature is the signature the hash was created with
  **/
  function recover(bytes32 requestHash, bytes memory signature)
    external
    pure
    returns (address);

}
