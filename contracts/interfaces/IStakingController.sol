// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "@openzeppelin/contracts-upgradeable/introspection/IERC165Upgradeable.sol";

interface IStakingController is IERC165Upgradeable {


  event DomainRequest(
    bytes32 indexed requestHash,
    address indexed requester,
    address indexed domainOwner
  );

  event RequestAccepted(
    string name,
    uint256 indexed Id,
    uint256 indexed parentId,
    uint256 indexed bid,
    address indexed bidder,
    address indexed dToken,
    bool isLocked
  );

  event BaseBidSet(
    string name,
    uint256 indexed parentId,
    uint256 indexed baseBid,
    address indexed dToken
  );

  /**
    @notice requestDomain allows a user to send a request for a new sub domain to a domains owner
    @param requestHash is the hashed data for a domain request
    @param domainOwner is the address of the domain parent's owner
  **/
  function requestDomain(
    bytes32 requestHash,
    address domainOwner
  ) external;

  /**
    @notice acceptSubRequest allows a domain owner to accept bids for sub domains
    @param parentId is the id number of the parent domain to the sub domain being requested
    @param bidAmount is the uint value of the amount of dTokens bid
    @param metadata is the uri of the domains metadata
    @param name is the name of the new domain being created
    @param signature is the signature of the bidder
    @param owner is the address of the account whos bid is being acceted
    @param isLocked is a bool representing whether or not the metadata for the sub domain is locked
  **/
  function acceptSubRequest(
      uint256 parentId,
      uint256 bidAmount,
      string memory metadata,
      string memory name,
      bytes memory signature,
      address bidder,
      address dToken,
      bool isLocked
  ) external;

  /**
    @notice setBaseBid allows a domain owner to set the base bid information for their domain
    @param parentId is the id number of the parent domain to the sub domain being requested
    @param baseAmount is the minimum amount of dToken acceptable as a bid for sub domains
    @param dToken is the dToken address the domain will accept bids for sub domains in
  **/
  function setBaseBid(
    uint256 parentId,
    uint256 baseAmount,
    address dToken
  ) external;

  /**
    @notice recover allows the hashed data of a domain request to be recovered
    @notice requestHash is the hash of the request being recovered
    @notice signature is the signature the hash was created with
  **/
  function recover(
    bytes32 requestHash,
    bytes memory signature
  )
  public
  pure
  returns (address);

  /**
    @notice toEthSignedMessageHash takens in a message hash and signs it for the message sender
    @param requestHash is the hash of the request message being signed
  **/
  function toEthSignedMessageHash(bytes32 requestHash) public pure returns (bytes32);

}
