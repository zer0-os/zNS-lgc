// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "../oz/proxy/Initializable.sol";
import "../oz/utils/ContextUpgradeable.sol";
import "../oz/introspection/ERC165Upgradeable.sol";
import "../oz/token/ERC721/ERC721HolderUpgradeable.sol";
import "../oz/access/OwnableUpgradeable.sol";

import "../interfaces/IBasicController.sol";
import "../interfaces/IRegistrar.sol";

contract AuthBasicController is
  IBasicController,
  ContextUpgradeable,
  ERC165Upgradeable,
  ERC721HolderUpgradeable,
  OwnableUpgradeable
{
  IRegistrar private registrar;
  mapping(address => bool) public authorizedAccounts;

  event AccountAuthorizationChanged(address account, bool isAuthorized);

  modifier authorized() {
    require(
      authorizedAccounts[_msgSender()] || _msgSender() == owner(),
      "Not Authorized"
    );
    _;
  }

  function initialize(IRegistrar _registrar) public initializer {
    __ERC165_init();
    __Context_init();
    __ERC721Holder_init();
    __Ownable_init();

    registrar = _registrar;
  }

  function setAccountAuthorizationStatus(address account, bool isAuthorized)
    external
    onlyOwner
  {
    if (isAuthorized) {
      require(!authorizedAccounts[account], "Account already authorized");
    } else {
      require(authorizedAccounts[account], "Account already not authorized");
    }
    authorizedAccounts[account] = isAuthorized;
    emit AccountAuthorizationChanged(account, isAuthorized);
  }

  function registerSubdomainExtended(
    uint256 parentId,
    string memory label,
    address owner,
    string memory metadataUri,
    uint256 royaltyAmount,
    bool lockOnCreation
  ) external override authorized returns (uint256) {
    address minter = _msgSender();

    uint256 id = registrar.registerDomainAndSend(
      parentId,
      label,
      minter,
      metadataUri,
      royaltyAmount,
      lockOnCreation,
      owner
    );

    return id;
  }
}
