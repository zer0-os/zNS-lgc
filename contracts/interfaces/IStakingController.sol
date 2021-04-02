// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "@openzeppelin/contracts-upgradeable/introspection/IERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";

interface IStakingController is IERC165Upgradeable, IERC721ReceiverUpgradeable {
  event DomainBidPlaced(
    bytes32 indexed requestHash,
    address indexed requester,
    address indexed domainOwner,
    string ipfsHash
  );

  event DomainBidAccepted(string bidIdentifier);

  event DomainBidFulfilled(string bidIdentifier);

  /**
    @notice requestDomain allows a user to send a request for a new sub domain to a domains owner
    @param requestHash is the hashed data for a domain request
    @param domainOwner is the address of the domain parent's owner
    @param ipfsHash is the IPFS hash containing the bids params(ex: name being requested, amount, stc)
  **/
  function placeDomainBid(
    bytes32 requestHash,
    address domainOwner,
    string memory ipfsHash
  ) external;

  /**
    @notice Approves a domain bid, allowing the domain to be created.
      Will emit a DomainBidAccepted event.
    @param parentId is the id number of the parent domain to the sub domain being requested
    @param ipfsHash is the IPFS hash of the bids information
    @param bidder is the address of the account that placed the bid being accepted
  **/
  function acceptSubRequest(
    uint256 parentId,
    string memory ipfsHash,
    address bidder
  ) external;

  /**
    @notice Fulfills a domain bid, creating the domain.
      Transfers tokens from bidders wallet into controller.
      Will emit a DomainBidFulfilled event.
    @param parentId is the id number of the parent domain to the sub domain being requested
    @param bidAmount is the uint value of the amount of infinity bid
    @param ipfsHash is the IPFS hash of the bids information
    @param name is the name of the new domain being created
    @param signature is the signature of the bidder
  **/
  function fulfillDomainBid(
    uint256 parentId,
    uint256 bidAmount,
    string memory ipfsHash,
    string memory name,
    bytes memory signature
  ) external;

  /**
    @notice recover allows the hashed data of a domain request to be recovered
    @notice requestHash is the hash of the request being recovered
    @notice signature is the signature the hash was created with
  **/
  function recover(bytes32 requestHash, bytes memory signature)
    public
    pure
    returns (address);

  /**
    @notice toEthSignedMessageHash takens in a message hash and signs it for the message sender
    @param requestHash is the hash of the request message being signed
  **/
  function toEthSignedMessageHash(bytes32 requestHash)
    public
    pure
    returns (bytes32);
}
