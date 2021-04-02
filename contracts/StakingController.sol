// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "./@openzeppelin/contracts-upgradeable/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

import "./interfaces/IRegistrar.sol";

contract StakingController is
  Initializable,
  ContextUpgradeable,
  ERC165Upgradeable
{

  using ECDSA for bytes32;

  IRegistrar private registrar;
  uint256 private rootDomain;

  mapping(uint => address) public domainToken;
  mapping(uint => uint) public baseBidAmounts;

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

  modifier authorized(uint256 domain) {
    require(registrar.domainExists(domain), "Invalid Domain");
    require(registrar.ownerOf(domain) == _msgSender(), "Not Authorized");
    _;
  }

  function initialize(IRegistrar _registrar) public initializer {
    __ERC165_init();
    __Context_init();

    registrar = _registrar;
    rootDomain = 0x0;
  }

    /**
      @notice requestDomain allows a user to send a request for a new sub domain to a domains owner
      @param requestHash is the hashed data for a domain request
      @param domainOwner is the address of the domain parent's owner
    **/
    function requestDomain(
      bytes32 requestHash,
      address domainOwner
    ) external {
      DomainRequest(
        requestHash,
        msg.sender,
        domainOwner
      );
    }

    /**
      @notice acceptSubRequest allows a domain owner to accept bids for sub domains
      @param parentId is the id number of the parent domain to the sub domain being requested
      @param bidAmount is the uint value of the amount of dTokens bid
      @param metadata is the uri of the domains metadata
      @param name is the name of the new domain being created
      @param bidder is the address of the account whos bid is being acceted
    **/
    function acceptSubRequest(
        uint256 parentId,
        uint256 bidAmount,
        string memory metadata,
        string memory name,
        bytes memory signature,
        address bidder,
        address dToken
    ) external authorized(parentId) {
      address recoveredbidder = recover(keccak256(abi.encode(bidAmount, name, parentId, metadata, dToken)), signature);
      require(bidder == recoveredbidder, 'StakingController: incorrect bidder');
      IERC20Upgradeable token = IERC20Upgradeable(domainToken[parentId]);
      require(token.balanceOf(bidder) >= bidAmount);
      token.transferFrom(bidder, msg.sender, bidAmount);
      uint256 id = registrar.registerDomain(parentId, name, bidder, msg.sender);
      domainToken[id] = dToken;
      emit RequestAccepted(
        name,
        id,
        parentId,
        bidAmount,
        bidder,
        dToken,
        isLocked
      );
    }

    /**
      @notice setBaseBid allows a domain owner to set the base bid information for their domain
      @param id is the id number of the domain whos base bid information is being set
      @param baseAmount is the minimum amount of dToken acceptable as a bid for sub domains
      @param dToken is the dToken address the domain will accept bids for sub domains in
    **/
    function setBaseBid(
      uint256 id,
      uint256 baseAmount,
      address dToken
    ) external {
      domainToken[id] = dToken;
      baseBidAmounts[id] = baseAmount;
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




}
