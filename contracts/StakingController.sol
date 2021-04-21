// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721HolderUpgradeable.sol";


import "./interfaces/IRegistrar.sol";

contract StakingController is
  Initializable,
  ContextUpgradeable,
  ERC165Upgradeable,
  ERC721HolderUpgradeable
{

  using SafeERC20Upgradeable for IERC20Upgradeable;

  IERC20Upgradeable private infinity;
  IRegistrar private registrar;
  address private controller;
  uint256 public bidCount;

  mapping(uint256 => Bid) public bids;
  mapping(uint256 => bool) public tokensHeld;
  mapping(uint256 => Bid) public acceptedBids;
  mapping(bytes32 => uint256) public domainIdentifier;

  struct Bid {
    uint256 parentId;
    uint256 bidAmount;
    address bidder;
    string name;
    bool accepted;
    bool approved;
  }

  event DomainBidPlaced(
  uint256 indexed parentId,
  uint256 indexed bidIdentifier,
  uint256 bidAmount,
  string indexed name,
  address bidder
  );

  event DomainBidApproved(uint256 indexed bidIdentifier);

  event DomainBidFulfilled(
    uint256 indexed bidIdentifier,
    string name,
    address recipient,
    uint256 indexed domainId,
    uint256 indexed parentID
  );

  event BidWithdrawn(uint256 indexed bidIdentifier);

  event TokenOwnershipRelenquished(uint256 indexed bidIdentifier);

  function initialize(IRegistrar _registrar, IERC20Upgradeable _infinity) public initializer {
    __ERC165_init();
    __Context_init();

    infinity = _infinity;
    registrar = _registrar;
    controller = address(this);
  }


    /**
      @notice placeDomainBid allows a user to send a request for a new sub domain to a domains owner
      @param _parentId is the id number of the parent domain to the sub domain being requested
      @param _bidAmount is the uint value of the amount of infinity bid
      @param _name is the name of the new domain being created
    **/
    function placeDomainBid(
      uint256 _parentId,
      uint256 _bidAmount,
      string memory _name
    ) external {
      require(registrar.domainExists(_parentId), "ZNS: Invalid Domain");
      bidCount++;
      bids[bidCount] = Bid({
        parentId: _parentId,
        bidAmount: _bidAmount,
        bidder: _msgSender(),
        name: _name,
        accepted: false,
        approved: false
      });

      emit DomainBidPlaced(
        _parentId,
        bidCount,
        _bidAmount,
        _name,
        _msgSender()
      );
    }

    /**
      @notice approveDomainBid approves a domain bid, allowing the domain to be created.
      @param bidIdentifier is the id number of the bid being accepted
    **/
    function approveDomainBid(
        uint256 bidIdentifier
    ) external {
      Bid storage bid = bids[bidIdentifier];
      require(bid.bidAmount != 0, "ZNS: Bid doesnt exist");
      require(registrar.domainExists(bid.parentId), "ZNS: Invalid Domain");
      require(registrar.ownerOf(bid.parentId) == _msgSender(), "ZNS: Not Authorized Owner");
      bid.accepted = true;
      emit DomainBidApproved(bidIdentifier);
    }


    /**
      @notice Fulfills a domain bid, creating the domain.
        Transfers tokens from bidders wallet into controller.
      @param bidIdentifier is the id number of the bid being fullfilled
      @param royaltyAmount is the royalty amount the creator sets for resales on zAuction
      @param metadata is the IPFS hash of the new domains information
      @param lockOnCreation is a bool representing whether or not the metadata for this domain is locked
    **/
    function fulfillDomainBid(
      uint256 bidIdentifier,
      uint256 royaltyAmount,
      string memory metadata,
      bool lockOnCreation
    ) external {
        Bid storage bid = bids[bidIdentifier];
        require(bid.approved == false, "ZNS: already fulfilled/withdrawn");
        require(bid.accepted == true, "ZNS: bid not accepted");
        infinity.safeTransferFrom(bid.bidder, controller, bid.bidAmount);
        uint256 id;
        bytes32 domainId;
        if(!registrar.domainExists(bid.parentId)){
           id = registrar.registerDomain(bid.parentId, bid.name, controller, bid.bidder);
           domainId = keccak256(abi.encode(bid.parentId, bid.name));
           domainIdentifier[domainId] = id;
        } else {
           domainId = keccak256(abi.encode(bid.parentId, bid.name));
           id = domainIdentifier[domainId];
           require(tokensHeld[id], "ZNS: Domain not held");
        }
        registrar.setDomainMetadataUri(id, metadata);
        registrar.setDomainRoyaltyAmount(id, royaltyAmount);
        registrar.transferFrom(controller, bid.bidder, id);
        acceptedBids[id] = bid;
        if (lockOnCreation) {
          registrar.lockDomainMetadataForOwner(id);
        }
        bid.approved = true;

        emit DomainBidFulfilled(
          bidIdentifier,
          bid.name,
          bid.bidder,
          id,
          bid.parentId
        );
      }

      /**
        @notice withdrawBid allows a bidder to withdraw a placed bid should they change their mind
        @param bidIdentifier is the number representing the bid being withdrawn
      **/
      function withdrawBid(
        uint256 bidIdentifier
      ) external {
        Bid storage bid = bids[bidIdentifier];
        require(bid.bidder == _msgSender(), "ZNS: Not bid creator");
        require(bid.accepted == false, "ZNS: Bid already accepted");
        bid.approved = true;
        emit BidWithdrawn(bidIdentifier);
      }

      /**
        @notice relenquishOwnership allows a domain owner to relenquish
                ownership of a domain they own
        @param tokenId is the tokenId of the domain being relenquished
        @dev this function relenquishes control of the domain to the staking controller and returns the
              user their staked funds. This function also unlocks the metadata for the domain if it
              is locked
      **/
      function relenquishOwnership(
        uint256 tokenId
      ) external {
        require(registrar.domainExists(tokenId), "ZNS: Invalid Domain");
        require(registrar.ownerOf(tokenId) == _msgSender(), "ZNS: Not Authorized Owner");
        registrar.transferFrom(_msgSender(), controller, tokenId);
        Bid memory bid = acceptedBids[tokenId];
        infinity.safeTransfer(bid.bidder, bid.bidAmount);
        tokensHeld[tokenId] = true;
        if(registrar.isDomainMetadataLocked(tokenId)){
          registrar.unlockDomainMetadata(tokenId);
        }
        emit TokenOwnershipRelenquished(tokenId);
      }
  }
