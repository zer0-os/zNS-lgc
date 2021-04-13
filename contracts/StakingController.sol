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

  mapping(bytes32 => bytes32) public approvedBids;

  event DomainBidPlaced(
    bytes32 indexed unsignedRequestHash,
    string bidIPFSHash,
    bytes indexed signature
  );

  event DomainBidApproved(string indexed bidIdentifier);

  event DomainBidFulfilled(string indexed bidIdentifier);

  modifier authorizedOwner(uint256 domain) {
    require(registrar.domainExists(domain), "Invalid Domain");
    require(registrar.ownerOf(domain) == _msgSender(), "Not Authorized Owner");
    _;
  }


  function initialize(IRegistrar _registrar, IERC20Upgradeable _Infinity) public initializer {
    __ERC165_init();
    __Context_init();

    infinity = _Infinity;
    registrar = _registrar;
  }

    /**
      @notice placeDomainBid allows a user to send a request for a new sub domain to a domains owner
      @param unsignedRequestHash is the un-signed hashed data for a domain bid request
      @param signature is the signature used to sign the request hash
      @param bidIPFSHash is the IPFS hash containing the bids params(ex: name being requested, amount, stc)
      @dev the IPFS hash must be emitted as a string here for the front end to be able to recover the bid info
      @dev signature is emitted here so that the domain owner approving the bid can use the recover function to check that
            the bid information in the IPFS hash matches the bid information used to create the signed message
    **/
    function placeDomainBid(
      bytes32 unsignedRequestHash,
      bytes memory signature,
      string memory bidIPFSHash
    ) external {
      emit DomainBidPlaced(
        unsignedRequestHash,
        bidIPFSHash,
        signature
      );
    }

    /**
      @notice approveDomainBid approves a domain bid, allowing the domain to be created.
      @param parentId is the id number of the parent domain to the sub domain being requested
      @param bidIPFSHash is the IPFS hash of the bids information
      @param unsignedRequestHash is the signed hashed data for a domain bid request
    **/
    function approveDomainBid(
        uint256 parentId,
        string memory bidIPFSHash,
        bytes32 unsignedRequestHash
    ) external authorizedOwner(parentId) {
      approvedBids[keccak256(abi.encode(bidIPFSHash))] = unsignedRequestHash;
      emit DomainBidApproved(bidIPFSHash);
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
      ) external {
        bytes32 unsignedRequestHash  = approvedBids[keccak256(abi.encode(metadata))];
        address recoveredbidder = recover(keccak256(abi.encode(bidAmount, name, parentId, metadata)), signature);
        address controller = address(this);
        require(unsignedRequestHash == keccak256(abi.encode(bidAmount, name, parentId, metadata)), 'StakingController: incorrect bid params');
        infinity.transferFrom(recoveredbidder, controller, bidAmount);
        address parentOwner = registrar.ownerOf(parentId);
        uint256 id = registrar.registerDomain(parentId, name, controller, parentOwner);
        // registrar.setDomainMetadataUri(id, metadata);
        // registrar.setDomainRoyaltyAmount(id, royaltyAmount);
        // registrar.transferFrom(controller, recoveredbidder, id);
        //
        // if (lockOnCreation) {
        //   registrar.lockDomainMetadataForOwner(id);
        // }
        emit DomainBidFulfilled(metadata);
      }

    /**
      @notice recover allows the un-signed hashed data of a domain request to be recovered
      @notice unsignedRequestHash is the un-signed hash of the request being recovered
      @notice signature is the signature the hash was signed with
    **/
    function recover(
      bytes32 unsignedRequestHash,
      bytes memory signature
    )
    public
    pure
    returns (address) {
        return unsignedRequestHash.recover(signature);
    }




  }
