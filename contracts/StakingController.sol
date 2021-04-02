// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "./@openzeppelin/contracts-upgradeable/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";


import "./interfaces/IRegistrar.sol";

contract StakingController is
  Initializable,
  ContextUpgradeable,
  ERC165Upgradeable,
  IERC721ReceiverUpgradeable
{

  using ECDSA for bytes32;

  IERC20Upgradeable private infinity;
  IRegistrar private registrar;
  uint256 private rootDomain;

  mapping(string => address) public approvedBids;

  event DomainBidPlaced(
    bytes32 indexed requestHash,
    address indexed requester,
    address indexed domainOwner
  );

  event DomainBidAccepted(uint256 bidIdentifier);

  event DomainBidFulfilled(uint256 bidIdentifier);

  modifier authorizedOwner(uint256 domain) {
    require(registrar.domainExists(domain), "Invalid Domain");
    require(registrar.ownerOf(domain) == _msgSender(), "Not Authorized Owner");
    _;
  }

  modifier authorizedRecipient(string memory ipfsHash) {
    require(approvedBids[ipfsHash] == _msgSender(), "Not Authorized Recipient")
    _;
  }

  function initialize(IRegistrar _registrar, IERC20Upgradeable _Infinity) public initializer {
    __ERC165_init();
    __Context_init();

    infinity = _Infinity;
    registrar = _registrar;
    rootDomain = 0x0;
  }

    /**
      @notice placeDomainBid allows a user to send a request for a new sub domain to a domains owner
      @param requestHash is the hashed data for a domain request
      @param domainOwner is the address of the domain parent's owner
      @param ipfsHash is the IPFS hash containing the bids params(ex: name being requested, amount, stc)
    **/
    function placeDomainBid(
      bytes32 requestHash,
      address domainOwner,
      string memory ipfsHash
    ) external {
      DomainBidPlaced(
        requestHash,
        msg.sender,
        domainOwner,
        ipfsHash
      );
    }

    /**
      @notice Approves a domain bid, allowing the domain to be created.
      @param parentId is the id number of the parent domain to the sub domain being requested
      @param ipfsHash is the IPFS hash of the bids information
      @param bidder is the address of the account that placed the bid being accepted
    **/
    function acceptSubRequest(
        uint256 parentId,
        string memory ipfsHash,
        address bidder
    ) external authorizedOwner(parentId) {
      approvedBids[ipfsHash] = bidder;
      emit DomainBidAccepted(ipfsHash);
    }

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
      ) external authorizedRecipient(ipfsHash) {
        address recoveredbidder = recover(keccak256(abi.encode(bidAmount, name, parentId, ipfsHash)), signature);
        require(bidder == recoveredbidder, 'StakingController: incorrect bid info');
        infinity.transferFrom(bidder, address(this), bidAmount);
        uint256 id = registrar.registerDomain(parentId, name, msg.sender, registrar.ownerOf(id));
        emit DomainBidFulfilled(ipfsHash);
      }

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
    returns (address) {
        return hash.recover(signature);
    }

    /**
      @notice toEthSignedMessageHash takens in a message hash and signs it for the message sender
      @param requestHash is the hash of the request message being signed
    **/
    function toEthSignedMessageHash(bytes32 requestHash) public pure returns (bytes32) {
        return hash.toEthSignedMessageHash();
    }

  }
