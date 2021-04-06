// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "@openzeppelin/contracts-upgradeable/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721HolderUpgradeable.sol";


import "./interfaces/IRegistrar.sol";

contract StakingController is
  Initializable,
  ContextUpgradeable,
  ERC165Upgradeable,
  ERC721HolderUpgradeable
{

  using ECDSAUpgradeable for bytes32;

  IERC20Upgradeable private infinity;
  IRegistrar private registrar;
  uint256 private rootDomain;

  mapping(bytes32 => address) public approvedBids;

  event DomainBidPlaced(
    bytes32 indexed requestHash,
    string indexed ipfsHash
  );

  event DomainBidAccepted(string indexed bidIdentifier);

  event DomainBidFulfilled(string indexed bidIdentifier);

  modifier authorizedOwner(uint256 domain) {
    require(registrar.domainExists(domain), "Invalid Domain");
    require(registrar.ownerOf(domain) == _msgSender(), "Not Authorized Owner");
    _;
  }

  modifier authorizedRecipient(string memory ipfsHash) {
    require(approvedBids[keccak256(abi.encode(ipfsHash))] == _msgSender(), "Not Authorized Recipient");
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
      @param ipfsHash is the IPFS hash containing the bids params(ex: name being requested, amount, stc)
      @dev the IPFS hash must be emitted as a string here for the front end to be able to recover the bid info
    **/
    function placeDomainBid(
      bytes32 requestHash,
      string memory ipfsHash
    ) external {
      emit DomainBidPlaced(
        requestHash,
        ipfsHash
      );
    }

    /**
      @notice approveDomainBid approves a domain bid, allowing the domain to be created.
      @param parentId is the id number of the parent domain to the sub domain being requested
      @param ipfsHash is the IPFS hash of the bids information
      @param bidder is the address of the account that placed the bid being accepted
    **/
    function approveDomainBid(
        uint256 parentId,
        string memory ipfsHash,
        address bidder
    ) external authorizedOwner(parentId) {
      approvedBids[keccak256(abi.encode(ipfsHash))] = bidder;
      emit DomainBidAccepted(ipfsHash);
    }

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
      ) external authorizedRecipient(metadata) {
        address recoveredbidder = recover(keccak256(abi.encode(bidAmount, name, parentId, metadata)), signature);
        address bidder = _msgSender();
        address controller = address(this);
        require(bidder == recoveredbidder, 'StakingController: incorrect bid info');
        infinity.transferFrom(bidder, controller, bidAmount);
        address parentOwner = registrar.ownerOf(parentId);
        uint256 id = registrar.registerDomain(parentId, name, controller, parentOwner);
        registrar.setDomainMetadataUri(id, metadata);
        registrar.setDomainRoyaltyAmount(id, royaltyAmount);
        registrar.transferFrom(controller, bidder, id);

        if (lockOnCreation) {
          registrar.lockDomainMetadataForOwner(id);
        }
        emit DomainBidFulfilled(metadata);
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
        return requestHash.recover(signature);
    }

  }
