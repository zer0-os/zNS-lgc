// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721HolderUpgradeable.sol";

import "./interfaces/IRegistrar.sol";
import "./interfaces/IStakingController.sol";

contract StakingController is
  Initializable,
  ContextUpgradeable,
  ERC165Upgradeable,
  ERC721HolderUpgradeable,
  IStakingController
{
  using SafeERC20Upgradeable for IERC20Upgradeable;

  IERC20Upgradeable private infinity;
  IRegistrar private registrar;
  address private controller;
  uint256 public requestCount;

  mapping(uint256 => Request) public requests;

  struct Request {
    uint256 parentId;
    uint256 offeredAmount;
    address requester;
    string requestedName;
    bool accepted;
    bool valid;
  }

  function initialize(IRegistrar _registrar, IERC20Upgradeable _infinity)
    public
    initializer
  {
    __ERC165_init();
    __Context_init();

    infinity = _infinity;
    registrar = _registrar;
    controller = address(this);
  }

  /**
      @notice placeDomainRequest allows a user to send a request for a new sub domain to a domains owner
      @param parentId is the id number of the parent domain to the sub domain being requested
      @param offeredAmount is the uint value of the amount of infinity request
      @param name is the name of the new domain being created
    **/
  function placeDomainRequest(
    uint256 parentId,
    uint256 offeredAmount,
    string memory name
  ) external override {
    require(registrar.domainExists(parentId), "ZNS: Invalid Domain");
    requestCount++;
    requests[requestCount] = Request({
      parentId: parentId,
      offeredAmount: offeredAmount,
      requester: _msgSender(),
      requestedName: name,
      accepted: false,
      valid: true
    });

    emit DomainRequestPlaced(
      parentId,
      requestCount,
      offeredAmount,
      name,
      _msgSender()
    );
  }

  /**
      @notice approveDomainRequest approves a domain request, allowing the domain to be created.
      @param requestIdentifier is the id number of the request being accepted
    **/
  function approveDomainRequest(uint256 requestIdentifier) external override {
    Request storage request = requests[requestIdentifier];
    require(request.valid == true, "ZNS: Request doesnt exist");
    require(
      registrar.ownerOf(request.parentId) == _msgSender(),
      "ZNS: Not Authorized Owner"
    );
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
  ) external override {
    Request storage request = requests[requestIdentifier];
    require(request.valid == true, "ZNS: request not valid");
    require(request.accepted == true, "ZNS: request not accepted");
    uint256 domainId =
      registrar.registerDomain(
        request.parentId,
        request.requestedName,
        controller,
        request.requester
      );
    registrar.setDomainMetadataUri(domainId, metadata);
    registrar.setDomainRoyaltyAmount(domainId, royaltyAmount);
    registrar.safeTransferFrom(controller, request.requester, domainId);
    if (lockOnCreation) {
      registrar.lockDomainMetadataForOwner(domainId);
    }
    request.valid = false;
    infinity.safeTransferFrom(
      request.requester,
      controller,
      request.offeredAmount
    );
    emit DomainRequestFulfilled(
      requestIdentifier,
      request.requestedName,
      request.requester,
      domainId,
      request.parentId
    );
  }

  /**
        @notice withdrawRequest allows a requester to withdraw a placed request should they change their mind
        @param requestIdentifier is the number representing the request being withdrawn
      **/
  function withdrawRequest(uint256 requestIdentifier) external override {
    Request storage request = requests[requestIdentifier];
    require(request.requester == _msgSender(), "ZNS: Not request creator");
    require(request.valid == true, "ZNS: request already accepted");
    request.valid = false;
    emit RequestWithdrawn(requestIdentifier);
  }
}
