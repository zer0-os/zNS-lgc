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

  struct DomainData {
    uint256 nonce;
  }

  mapping(uint256 => Request) public requests;
  mapping(uint256 => DomainData) public domainData;

  struct Request {
    uint256 parentId;
    uint256 offeredAmount;
    address requester;
    string requestedName;
    bool accepted;
    bool valid;
    uint256 domainNonce;
  }

  function initialize(IRegistrar _registrar, IERC20Upgradeable _infinity)
    public
    initializer
  {
    __ERC165_init();
    __Context_init();
    __ERC721Holder_init();

    infinity = _infinity;
    registrar = _registrar;
    controller = address(this);
  }

  /**
   * @notice placeDomainRequest allows a user to send a request for a new sub domain to a domains owner
   * @param parentId is the id number of the parent domain to the sub domain being requested
   * @param offeredAmount is the uint value of the amount of infinity request
   * @param name is the name of the new domain being created
   * @param requestUri is the uri to a JSON object which will have more details about the request (for ui)
   **/
  function placeDomainRequest(
    uint256 parentId,
    uint256 offeredAmount,
    string memory name,
    string memory requestUri
  ) external override {
    require(
      registrar.domainExists(parentId),
      "Staking Controller: Invalid Domain"
    );
    require(bytes(name).length > 0, "Staking Controller: Name is empty");

    requestCount++;

    // Calculate what the created domain's id would be so we can get the nonce
    uint256 domainId = calculateDomainId(parentId, name);
    uint256 domainNonce = domainData[domainId].nonce;

    requests[requestCount] = Request({
      parentId: parentId,
      offeredAmount: offeredAmount,
      requester: _msgSender(),
      requestedName: name,
      accepted: false,
      valid: true,
      domainNonce: domainNonce
    });

    emit DomainRequestPlaced(
      parentId,
      requestCount,
      offeredAmount,
      requestUri,
      name,
      _msgSender(),
      domainNonce
    );
  }

  /**
   * @notice approveDomainRequest approves a domain request, allowing the domain to be created.
   * @param requestIdentifier is the id number of the request being accepted
   **/
  function approveDomainRequest(uint256 requestIdentifier) external override {
    Request storage request = requests[requestIdentifier];

    require(request.valid, "Staking Controller: Request doesnt exist");
    require(
      registrar.ownerOf(request.parentId) == _msgSender(),
      "Staking Controller: Not Authorized Owner"
    );
    require(!request.accepted, "Staking Controller: Request already accepted");

    uint256 domainId =
      calculateDomainId(request.parentId, request.requestedName);

    require(
      request.domainNonce == domainData[domainId].nonce,
      "Staking Controller: Request is outdated"
    );

    request.accepted = true;

    emit DomainRequestApproved(requestIdentifier);
  }

  /**
   *  @notice Fulfills a domain request, creating the domain.
   *    Transfers tokens from requesters wallet into controller.
   *  @param requestIdentifier is the id number of the request being fullfilled
   *  @param royaltyAmount is the royalty amount the creator sets for resales on zAuction
   *  @param metadata is the IPFS hash of the new domains information
   *  @param lockOnCreation is a bool representing whether or not the metadata for this domain is locked
   **/
  function fulfillDomainRequest(
    uint256 requestIdentifier,
    uint256 royaltyAmount,
    string memory metadata,
    bool lockOnCreation
  ) external override {
    Request storage request = requests[requestIdentifier];

    require(
      _msgSender() == request.requester,
      "Staking Controller: Only requester may fulfill."
    );
    require(request.valid, "Staking Controller: Request not valid");
    require(request.accepted, "Staking Controller: Request not accepted");

    uint256 predictedDomainId =
      calculateDomainId(request.parentId, request.requestedName);

    require(
      request.domainNonce == domainData[predictedDomainId].nonce,
      "Staking Controller: Request is outdated."
    );

    request.valid = false;

    infinity.safeTransferFrom(
      request.requester,
      controller,
      request.offeredAmount
    );

    uint256 domainId =
      registrar.registerDomain(
        request.parentId,
        request.requestedName,
        controller,
        request.requester
      );

    require(
      predictedDomainId == domainId,
      "Staking Controller: internal error, domain id's did not match."
    );

    // Increment the nonce on the domain data so any existing requests for this domain become invalid
    uint256 newDomainNonce = domainData[domainId].nonce + 1;
    domainData[domainId].nonce = newDomainNonce;

    registrar.setDomainMetadataUri(domainId, metadata);
    registrar.setDomainRoyaltyAmount(domainId, royaltyAmount);
    registrar.safeTransferFrom(controller, request.requester, domainId);

    if (lockOnCreation) {
      registrar.lockDomainMetadataForOwner(domainId);
    }

    emit DomainRequestFulfilled(
      requestIdentifier,
      request.requestedName,
      request.requester,
      domainId,
      request.parentId,
      newDomainNonce
    );
  }

  /**
   *  @notice withdrawRequest allows a requester to withdraw a placed request should they change their mind
   *  @param requestIdentifier is the number representing the request being withdrawn
   **/
  function withdrawRequest(uint256 requestIdentifier) external override {
    Request storage request = requests[requestIdentifier];

    require(
      request.requester == _msgSender(),
      "Staking Controller: Not Requestor"
    );
    require(request.valid, "Staking Controller: Request is invalid");

    uint256 predictedDomainId =
      calculateDomainId(request.parentId, request.requestedName);
    require(
      request.domainNonce == domainData[predictedDomainId].nonce,
      "Staking Controller: Request is outdated"
    );

    request.valid = false;

    emit RequestWithdrawn(requestIdentifier);
  }

  /**
   *  @notice Calculates what a child domain id would be.
   *    This must always return the same id as what the ZNS Registrar would return
   *  @param parentId id of the parent
   *  @param name name of the child
   **/
  function calculateDomainId(uint256 parentId, string memory name)
    public
    pure
    returns (uint256)
  {
    uint256 labelHash = uint256(keccak256(bytes(name)));
    uint256 domainId =
      uint256(keccak256(abi.encodePacked(parentId, labelHash)));

    return domainId;
  }
}
