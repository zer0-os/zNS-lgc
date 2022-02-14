// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;
pragma experimental ABIEncoderV2;

import "./oz/proxy/Initializable.sol";
import "./oz/utils/ContextUpgradeable.sol";
import "./oz/introspection/ERC165Upgradeable.sol";
import "./oz/token/ERC721/ERC721HolderUpgradeable.sol";
import {OwnableUpgradeable} from "./oz/access/OwnableUpgradeable.sol";

import "./interfaces/IBasicController.sol";
import "./interfaces/IRegistrar.sol";

contract OwnableController is
  ContextUpgradeable,
  OwnableUpgradeable,
  ERC165Upgradeable,
  ERC721HolderUpgradeable
{
  IRegistrar private registrar;
  uint256 public rootDomain; // for upgrade reasons

  modifier authorized(uint256 domain) {
    require(
      registrar.ownerOf(domain) == _msgSender() || _msgSender() == owner(),
      "Zer0 Controller: Not Authorized"
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

  function mintDomainsBulk(
    uint256 parentId,
    uint256 startLabelIndex,
    string[] calldata metadataUris,
    address[] calldata users
  ) external onlyOwner {
    uint256 metadataCount = metadataUris.length;
    require(metadataCount == users.length, "Zer0 Controller: 1 Uri Per User");
    for (uint256 i = 0; i < metadataCount; i++) {
      uint256 domainId = registrar.registerDomain(
        parentId,
        toString(startLabelIndex + i),
        address(this),
        metadataUris[i],
        0,
        true
      );
      registrar.transferFrom(address(this), users[i], domainId);
    }
  }

  function mintDomainsBulk(
    uint256 parentId,
    string[] calldata labels,
    string[] calldata metadataUris,
    address user
  ) external onlyOwner {
    uint256 metadataCount = metadataUris.length;
    require(metadataCount == labels.length, "Zer0 Controller: 1 Label Per Uri");
    for (uint256 i = 0; i < metadataUris.length; i++) {
      uint256 domainId = registrar.registerDomain(
        parentId,
        labels[i],
        address(this),
        metadataUris[i],
        0,
        true
      );
      registrar.transferFrom(address(this), user, domainId);
    }
  }

  function mintDomainsBulk(
    uint256 parentId,
    string[] calldata labels,
    string[] calldata metadataUris,
    address[] calldata users
  ) external onlyOwner {
    uint256 metadataCount = metadataUris.length;
    require(metadataCount == labels.length, "Zer0 Controller: 1 Label Per Uri");
    require(metadataCount == users.length, "Zer0 Controller: 1 Uri Per User");
    for (uint256 i = 0; i < metadataUris.length; i++) {
      uint256 domainId = registrar.registerDomain(
        parentId,
        labels[i],
        address(this),
        metadataUris[i],
        0,
        true
      );
      registrar.transferFrom(address(this), users[i], domainId);
    }
  }

  /**
   * @dev Converts a `uint256` to its ASCII `string` decimal representation.
   */
  function toString(uint256 value) internal pure returns (string memory) {
    // Inspired by OraclizeAPI's implementation - MIT licence
    // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol

    if (value == 0) {
      return "0";
    }
    uint256 temp = value;
    uint256 digits;
    while (temp != 0) {
      digits++;
      temp /= 10;
    }
    bytes memory buffer = new bytes(digits);
    while (value != 0) {
      digits -= 1;
      buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
      value /= 10;
    }
    return string(buffer);
  }
}
