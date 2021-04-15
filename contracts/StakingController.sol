pragma solidity ^0.7.3;

import "@openzeppelin/contracts-upgradeable/cryptography/ECDSAUpgradeable.sol";
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

  using ECDSAUpgradeable for bytes32;
  using SafeERC20Upgradeable for IERC20Upgradeable;

  IERC20Upgradeable public infinity;
  IRegistrar private registrar;
  bytes32 DOMAIN_SEPARATOR;

  bytes32 constant EIP712DOMAIN_TYPEHASH = keccak256(
      "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
  );

  bytes32 constant BID_TYPEHASH = keccak256(
      "Bid(uint256 amount,uint256 parentId,string bidIPFSHash,string name)"
  );

  struct EIP712Domain {
      string  name;
      string  version;
      uint256 chainId;
      address verifyingContract;
  }

  struct Bid {
      uint256 amount;
      uint256 parentId;
      string bidIPFSHash;
      string name;
  }

  mapping(bytes32 => bool) public approvedBids;

  event DomainBidPlaced(
    bytes32 indexed unsignedRequestHash,
    string indexed bidIPFSHash,
    bytes indexed signature
  );

  event DomainBidApproved(string indexed bidIdentifier);

  event DomainBidFulfilled(
    string indexed bidIdentifier,
    string  name,
    address recoveredbidder,
    uint256 indexed id,
    uint256 indexed parentID
  );

  modifier authorizedOwner(uint256 domain) {
    require(registrar.domainExists(domain), "Zer0 Naming Service: Invalid Domain");
    require(registrar.ownerOf(domain) == _msgSender(), "Zer0 Naming Service: Not Authorized Owner");
    _;
  }


  function initialize(IRegistrar _registrar, IERC20Upgradeable _Infinity) public initializer {
    __ERC165_init();
    __Context_init();

    infinity = _Infinity;
    registrar = _registrar;

    DOMAIN_SEPARATOR = hash(EIP712Domain({
        name: "Staking Controller",
        version: '0',
        chainId: 42,
        verifyingContract: address(this)
    }));
  }


    /**
      @notice placeDomainBid allows a user to send a request for a new sub domain to a domains owner
      @param parentId is the id number of the parent domain to the sub domain being requested
      @param unsignedRequestHash is the un-signed hashed data for a domain bid request
      @param signature is the signature used to sign the request hash
      @param bidIPFSHash is the IPFS hash containing the bids params(ex: name being requested, amount, stc)
      @dev the IPFS hash must be emitted as a string here for the front end to be able to recover the bid info
      @dev signature is emitted here so that the domain owner approving the bid can use the recover function to check that
            the bid information in the IPFS hash matches the bid information used to create the signed message
    **/
    function placeDomainBid(
      uint256 parentId,
      bytes32 unsignedRequestHash,
      bytes memory signature,
      string memory bidIPFSHash
    ) external {
      require(registrar.domainExists(parentId), "Zer0 Naming Service: Invalid Domain");
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
      @param signature is the signed hashed data for a domain bid request
    **/
    function approveDomainBid(
        uint256 parentId,
        string memory bidIPFSHash,
        bytes memory signature
    ) external authorizedOwner(parentId) {
      bytes32 hashOfSig = keccak256(abi.encode(signature));
      approvedBids[hashOfSig] = true;
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
        bool lockOnCreation,
        address recipient
      ) external {
        bytes32 recoveredBidHash = createBid(parentId, bidAmount, metadata, name);
        address recoveredBidder = recover(recoveredBidHash, signature);
        require(recipient == recoveredBidder, "Zer0 Naming Service: bid info doesnt match msg/ doesnt exist");
        bytes32 hashOfSig = keccak256(abi.encode(signature));
        require(approvedBids[hashOfSig] == true, "Zer0 Naming Service: has been fullfilled");
        address controller = address(this);
        infinity.safeTransferFrom(recoveredBidder, controller, bidAmount);
        uint256 id = registrar.registerDomain(parentId, name, controller, recoveredBidder);
        registrar.setDomainMetadataUri(id, metadata);
        registrar.setDomainRoyaltyAmount(id, royaltyAmount);
        registrar.transferFrom(controller, recoveredBidder, id);

        if (lockOnCreation) {
          registrar.lockDomainMetadataForOwner(id);
        }
        approvedBids[hashOfSig] = false;
        emit DomainBidFulfilled(
          metadata,
          name,
          recoveredBidder,
          id,
          parentId
        );
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
        return unsignedRequestHash.toEthSignedMessageHash().recover(signature);
      }

      /**
      @notice createBid is a pure function  that creates a bid hash for the end user
      @param parentId is the ID of the domain where the sub domain is being requested
      @param bidAmount is the amount being bid for the domain
      @param bidIPFSHash is the IPFS hash that contains the bids information
      @param name is the name of the sub domain being requested
      **/
      function createBid(
        uint256 parentId,
        uint256 bidAmount,
        string memory bidIPFSHash,
        string memory name
      ) public pure returns(bytes32) {
        return keccak256(abi.encode(bidAmount, name, parentId, bidIPFSHash));
      }


      function hash(EIP712Domain memory eip712Domain) internal pure returns (bytes32) {
        return keccak256(abi.encode(
          EIP712DOMAIN_TYPEHASH,
          keccak256(bytes(eip712Domain.name)),
          keccak256(bytes(eip712Domain.version)),
          eip712Domain.chainId,
          eip712Domain.verifyingContract
        ));
      }

      function hash(Bid memory bid) internal pure returns (bytes32) {
        return keccak256(abi.encode(
          BID_TYPEHASH,
          bid.amount,
          bid.parentId,
          bid.bidIPFSHash,
          bid.name
        ));
      }

      function verify(Bid memory bid, uint8 v, bytes32 r, bytes32 s) internal view returns (address) {
        // Note: we need to use `encodePacked` here instead of `encode`.
        bytes32 digest = keccak256(abi.encodePacked(
          "\x19\x01",
          DOMAIN_SEPARATOR,
          hash(bid)
        ));
        return ecrecover(digest, v, r, s);
      }
  }
