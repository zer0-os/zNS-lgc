// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./interfaces/IRegistrar.sol";
import {IStakingControllerV2} from "./interfaces/IStakingControllerV2.sol";
import {ITokenSafelist} from "./interfaces/ITokenSafelist.sol";

contract StakingControllerV2 is
  Initializable,
  ContextUpgradeable,
  ERC165Upgradeable,
  OwnableUpgradeable,
  IStakingControllerV2
{
  using SafeERC20Upgradeable for IERC20Upgradeable;

  ITokenSafelist public tokenSafelist;
  IERC20Upgradeable public defaultToken;
  IRegistrar public registrar;

  uint256 public requestCount;

  struct DomainData {
    // Tracks the request which was fulfilled to create this domain
    uint256 fulfilledRequestId;
    // Tracks the current (actual) domain token of a domain (will always be a token)
    address domainToken;
    // Tracks what token was used to stake for this domain
    IERC20Upgradeable stakedToken;
  }

  mapping(uint256 => Request) public requests;
  mapping(uint256 => DomainData) public domainData;

  struct Request {
    uint256 parentId;
    uint256 offeredAmount;
    address requester;
    string requestedName;
    bool accepted;
    address domainToken; // may be address(0)
    bool fulfilled;
  }

  function initialize(
    IRegistrar _registrar,
    IERC20Upgradeable _defaultToken,
    ITokenSafelist _tokenSafelist
  ) public initializer {
    __ERC165_init();
    __Context_init();
    __Ownable_init();

    defaultToken = _defaultToken;
    registrar = _registrar;
    tokenSafelist = _tokenSafelist;
  }

  function setTokenDefaultToken(IERC20Upgradeable _defaultToken)
    public
    onlyOwner
  {
    require(defaultToken != _defaultToken, "Same Token");
    defaultToken = _defaultToken;
  }

  modifier authorized(uint256 domain) {
    require(
      registrar.ownerOf(domain) == _msgSender(),
      "Zer0 Controller: Not Authorized"
    );
    _;
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
    string memory requestUri,
    address domainToken
  ) external override {
    require(
      registrar.domainExists(parentId),
      "Staking Controller: Invalid Domain"
    );
    require(bytes(name).length > 0, "Staking Controller: Name is empty");

    if (domainToken != address(0)) {
      require(
        tokenSafelist.isTokenSafelisted(domainToken),
        "Staking Controller: Domain Token not safelisted"
      );
    }

    requestCount++;

    // Calculate what the created domain's id would be so we can get the nonce
    uint256 domainId = calculateDomainId(parentId, name);

    require(
      !registrar.domainExists(domainId),
      "Staking Controller: Domain already exists."
    );

    requests[requestCount] = Request({
      parentId: parentId,
      offeredAmount: offeredAmount,
      requester: _msgSender(),
      requestedName: name,
      accepted: false,
      domainToken: domainToken,
      fulfilled: false
    });

    emit DomainRequestPlaced(
      parentId,
      requestCount,
      offeredAmount,
      requestUri,
      name,
      _msgSender(),
      domainToken
    );
  }

  /**
   * @notice approveDomainRequest approves a domain request, allowing the domain to be created.
   *      two different requests can be approved at a time, whichever requestor fulfills their
   *      request first gets to fulfill the request.
   * @param requestId is the id number of the request being accepted
   **/
  function approveDomainRequest(uint256 requestId) external override {
    Request storage request = requests[requestId];

    require(
      request.requester != address(0),
      "Staking Controller: Request doesn't exist"
    );

    require(
      registrar.ownerOf(request.parentId) == _msgSender(),
      "Staking Controller: Not Authorized Owner"
    );
    require(!request.accepted, "Staking Controller: Request already accepted");

    uint256 domainId = calculateDomainId(
      request.parentId,
      request.requestedName
    );

    require(
      !registrar.domainExists(domainId),
      "Staking Controller: Domain already exists."
    );

    request.accepted = true;

    emit DomainRequestApproved(requestId);
  }

  /**
   *  @notice Fulfills a domain request, creating the domain.
   *    Transfers tokens from requesters wallet into controller.
   *  @param requestId is the id number of the request being fullfilled
   *  @param royaltyAmount is the royalty amount the creator sets for resales on zAuction
   *  @param metadata is the IPFS hash of the new domains information
   *  @param lockOnCreation is a bool representing whether or not the metadata for this domain is locked
   **/
  function fulfillDomainRequest(
    uint256 requestId,
    uint256 royaltyAmount,
    string memory metadata,
    bool lockOnCreation
  ) external override returns (uint256) {
    Request storage request = requests[requestId];

    // Only allow requestor to fulfill
    require(
      _msgSender() == request.requester,
      "Staking Controller: Only requester may fulfill."
    );

    require(request.accepted, "Staking Controller: Request not accepted");

    uint256 predictedDomainId = calculateDomainId(
      request.parentId,
      request.requestedName
    );

    require(
      !request.fulfilled,
      "Staking Controller: Request already fulfilled."
    );

    require(
      !registrar.domainExists(predictedDomainId),
      "Staking Controller: Domain already exists."
    );

    request.fulfilled = true;

    // Gets the configured ERC20 token for a domain, will default to infinity
    IERC20Upgradeable parentDomainToken = getDomainToken(request.parentId);

    // This will fail if the user hasn't approved the token or have enough
    parentDomainToken.safeTransferFrom(
      request.requester,
      address(this),
      request.offeredAmount
    );

    // Track the request which was fulfilled for this domain
    domainData[predictedDomainId].fulfilledRequestId = requestId;

    // Lock the domain token on registration
    if (request.domainToken != address(0)) {
      domainData[predictedDomainId].domainToken = request.domainToken;
    } else {
      domainData[predictedDomainId].domainToken = address(parentDomainToken);
    }

    // Lock the token that was used to stake with
    domainData[predictedDomainId].stakedToken = parentDomainToken;

    // This will fail if the domain already exists
    uint256 domainId = registrar.registerDomain(
      request.parentId,
      request.requestedName,
      request.requester,
      metadata,
      royaltyAmount,
      lockOnCreation
    );

    /*
     * This should never really happen, but if it does it means the controller
     * is somehow calculating the domainId different than the Registrar which
     * means we can't reliably track domain data
     */
    require(
      predictedDomainId == domainId,
      "Staking Controller: internal error, domain id's did not match."
    );

    emit DomainRequestFulfilled(
      requestId,
      request.requestedName,
      request.requester,
      domainId,
      request.parentId,
      domainData[domainId].domainToken
    );

    return domainId;
  }

  /**
   * @notice Used to set the domain token of a domain which doesn't have one set.
   *         Can only be called by the domain owner, if the domain exists.
   * @param domainId The domain id
   * @param token The token address to be the domain token
   */
  function setDomainToken(uint256 domainId, address token)
    external
    authorized(domainId)
  {
    if (domainData[domainId].domainToken != address(0)) {
      revert("Staking Controller: Domain Token already set.");
    }

    domainData[domainId].domainToken = token;

    emit DomainTokenSet(domainId, token);
  }

  /**
   * @notice Used to set the domain token of a domain which doesn't have one set.
   *         Can only be called by the domain owner, if the domain exists.
   * @param domainId The domain id
   * @param token The token address to be the domain token
   */
  function setDomainTokenAdmin(uint256 domainId, address token)
    external
    onlyOwner
  {
    if (domainData[domainId].domainToken != address(0)) {
      revert("Staking Controller: Domain Token already set.");
    }

    domainData[domainId].domainToken = token;

    emit DomainTokenSet(domainId, token);
  }

  /**
   * @notice Gets the domain token for a given domain
   * @param domain The domain id
   */
  function getDomainToken(uint256 domain)
    public
    view
    override
    returns (IERC20Upgradeable)
  {
    if (domain == 0) {
      return defaultToken;
    }

    address domainToken = domainData[domain].domainToken;

    if (domainToken != address(0)) {
      return IERC20Upgradeable(domainToken);
    }

    // In the case that a domain's token was not indicated, defaults to the parent's
    return getDomainToken(registrar.parentOf(domain));
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
    uint256 domainId = uint256(
      keccak256(abi.encodePacked(parentId, labelHash))
    );

    return domainId;
  }
}