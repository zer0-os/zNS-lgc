// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import {IERC165Upgradeable} from "@openzeppelin/contracts-upgradeable/introspection/IERC165Upgradeable.sol";
import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

interface IStakingController is IERC165Upgradeable {
  event DomainRequestPlaced(
    uint256 indexed parentId,
    uint256 indexed requestId,
    uint256 offeredAmount,
    string requestUri,
    string indexed name,
    address requestor,
    address domainToken
  );

  event DomainRequestApproved(uint256 indexed requestId);

  event DomainRequestFulfilled(
    uint256 indexed requestId,
    string name,
    address recipient,
    uint256 indexed domainId,
    uint256 indexed parentID,
    address domainToken
  );

  event DomainTokenSet(uint256 indexed domainId, address domainToken);

  function getDomainToken(uint256 domain)
    external
    view
    returns (IERC20Upgradeable);

  /**
   * @notice placeDomainRequest allows a user to send a request for a new sub domain to a domains owner
   * @param parentId is the id number of the parent domain to the sub domain being requested
   * @param bidAmount is the uint value of the amount of infinity bid
   * @param name is the name of the new domain being created
   **/
  function placeDomainRequest(
    uint256 parentId,
    uint256 bidAmount,
    string memory name,
    string memory requestUri,
    address domainToken
  ) external;

  /**
   * @notice approveDomainRequest approves a domain request, allowing the domain to be created.
   * @param requestId is the id number of the request being accepted
   **/
  function approveDomainRequest(uint256 requestId) external;

  /**
   * @notice Fulfills a domain bid, creating the domain.
   *   Transfers tokens from bidders wallet into controller.
   * @param bidId is the id number of the bid being fullfilled
   * @param royaltyAmount is the royalty amount the creator sets for resales on zAuction
   * @param metadata is the IPFS hash of the new domains information
   * @param lockOnCreation is a bool representing whether or not the metadata for this domain is locked
   **/
  function fulfillDomainRequest(
    uint256 bidId,
    uint256 royaltyAmount,
    string memory metadata,
    bool lockOnCreation
  ) external returns (uint256);
}
