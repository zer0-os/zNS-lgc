// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "@openzeppelin/contracts/token/ERC721/ERC721Pausable.sol";
import "./interfaces/IRegistry.sol";

contract Registrar is ERC721Pausable {
  IRegistry public registry;

  constructor(IRegistry _registry) ERC721("Zer0 Name Service", "ZNS") {
    registry = _registry;
  }
}
