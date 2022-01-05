// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721HolderUpgradeable.sol";

import "./interfaces/IBasicController.sol";
import "./interfaces/IRegistrar.sol";

contract BasicController is
  IBasicController,
  ContextUpgradeable,
  ERC165Upgradeable,
  ERC721HolderUpgradeable
{
  IRegistrar private registrar;
  uint256 rootDomain; // for upgrade reasons
  address admin; // not writeable - can mint a domain at any level in zNS

  modifier authorized(uint256 domain) {
    require(
      registrar.ownerOf(domain) == _msgSender() ||
      _msgSender() == admin,
      "Zer0 Controller: Not Authorized"
    );
    _;
  }

  modifier onlyAdmin(){
    require(_msgSender() == admin, "Zer0 Controller: Admin Only");
    _;
  }

  function initialize(IRegistrar _registrar, address _admin) public initializer {
    __ERC165_init();
    __Context_init();
    __ERC721Holder_init();

    registrar = _registrar;
    admin = _admin;
  }

  function setAdmin(address newAdmin) public onlyAdmin {
    admin = newAdmin;
  }

  function registerSubdomainExtended(
    uint256 parentId,
    string memory label,
    address owner,
    string memory metadata,
    uint256 royaltyAmount,
    bool lockOnCreation
  ) external override authorized(parentId) returns (uint256) {
    address minter = _msgSender();

    uint256 id = registrar.registerDomain(
      parentId,
      label,
      minter,
      metadata,
      royaltyAmount,
      lockOnCreation
    );

    emit RegisteredDomain(label, id, parentId, owner, minter);

    return id;
  }

  function mintDomainsBulk(
    uint256 parentId, 
    uint256 startLabelIndex, 
    string[] calldata metadataUris, 
    address[] calldata users) external onlyAdmin{
      uint length = metadataUris.length;
      require(metadataUris.length == users.length,
        "Zer0 Controller: 1 Uri Per User");
      for(uint i=0; i < metadataUris.length; i++){
        uint256 domainId = registerSubdomainExtended(parentId, startLabelIndex + i, address(this), metadataUris[i], 0, true);
        registrar.transferFrom(address(this), users[i], domainId);
      }
  }
}
