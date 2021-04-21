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
  uint256 public requestCount;

  mapping(uint256 => Request) public requests;
  mapping(uint256 => bool) public tokensHeld;
  mapping(uint256 => Request) public acceptedRequests;
  mapping(bytes32 => uint256) public domainIdentifier;

  struct Request {
    uint256 parentId;
    uint256 requestAmount;
    address requester;
    string name;
    bool accepted;
    bool fulfilled;
    bool valid;
  }

  event DomainRequestPlaced(
  uint256 indexed parentId,
  uint256 indexed requestIdentifier,
  uint256 requestAmount,
  string indexed name,
  address requestdder
  );

  event DomainRequestApproved(uint256 indexed requestIdentifier);

  event DomainRequestFulfilled(
    uint256 indexed requestIdentifier,
    string name,
    address recipient,
    uint256 indexed domainId,
    uint256 indexed parentID
  );

  event RequestWithdrawn(uint256 indexed requestIdentifier);


  function initialize(IRegistrar _registrar, IERC20Upgradeable _infinity) public initializer {
    __ERC165_init();
    __Context_init();

    infinity = _infinity;
    registrar = _registrar;
    controller = address(this);
  }


    /**
      @notice placeDomainRequest allows a user to send a request for a new sub domain to a domains owner
      @param _parentId is the id number of the parent domain to the sub domain being requested
      @param _requestAmount is the uint value of the amount of infinity request
      @param _name is the name of the new domain being created
    **/
    function placeDomainRequest(
      uint256 _parentId,
      uint256 _requestAmount,
      string memory _name
    ) external {
      require(registrar.domainExists(_parentId), "ZNS: Invalid Domain");
      requestCount++;
      requests[requestCount] = Request({
        parentId: _parentId,
        requestAmount: _requestAmount,
        requester: _msgSender(),
        name: _name,
        accepted: false,
        fulfilled: false,
        valid: false
      });

      emit DomainRequestPlaced(
        _parentId,
        requestCount,
        _requestAmount,
        _name,
        _msgSender()
      );
    }

    /**
      @notice approveDomainRequest approves a domain request, allowing the domain to be created.
      @param requestIdentifier is the id number of the request being accepted
    **/
    function approveDomainRequest(
        uint256 requestIdentifier
    ) external {
      Request storage request = requests[requestIdentifier];
      require(request.requestAmount != 0, "ZNS: Request doesnt exist");
      require(registrar.domainExists(request.parentId), "ZNS: Invalid Domain");
      require(registrar.ownerOf(request.parentId) == _msgSender(), "ZNS: Not Authorized Owner");
      request.accepted = true;
      emit DomainRequestApproved(requestIdentifier);
    }


    /**
      @notice Fulfills a domain request, creating the domain.
        Transfers tokens from requesters wallet into controller.
      @param requestIdentifier is the id number of the request being fullfilled
      @param royaltyAmount is the royalty amount the creator sets for resales on zAuction
      @param metadata is the IPFS hash of the new domains information
      @param lockOnCreation is a bool representing whether or not the metadata for this domain is locked
    **/
    function fulfillDomainRequest(
      uint256 requestIdentifier,
      uint256 royaltyAmount,
      string memory metadata,
      bool lockOnCreation
    ) external {
        Request storage request = requests[requestIdentifier];
        require(request.fulfilled == false, "ZNS: already fulfilled");
        require(request.valid == false, "ZNS: request not valid");
        require(request.accepted == true, "ZNS: request not accepted");
        uint256 domainId = registrar.registerDomain(request.parentId, request.name, controller, request.requester);
        registrar.setDomainMetadataUri(domainId, metadata);
        registrar.setDomainRoyaltyAmount(domainId, royaltyAmount);
        registrar.transferFrom(controller, request.requester, domainId);
        acceptedRequests[domainId] = request;
        if (lockOnCreation) {
          registrar.lockDomainMetadataForOwner(domainId);
        }
        request.fulfilled = true;
        infinity.safeTransferFrom(request.requester, controller, request.requestAmount);

        emit DomainRequestFulfilled(
          requestIdentifier,
          request.name,
          request.requester,
          domainId,
          request.parentId
        );
      }

      /**
        @notice withdrawRequest allows a requester to withdraw a placed request should they change their mind
        @param requestIdentifier is the number representing the request being withdrawn
      **/
      function withdrawRequest(
        uint256 requestIdentifier
      ) external {
        Request storage request = requests[requestIdentifier];
        require(request.requester == _msgSender(), "ZNS: Not request creator");
        require(request.accepted == false, "ZNS: request already accepted");
        request.valid = true;
        emit RequestWithdrawn(requestIdentifier);
      }


  }
