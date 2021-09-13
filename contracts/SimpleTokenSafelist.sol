// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import {ITokenSafelist} from "./interfaces/ITokenSafelist.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract SimpleTokenSafelist is ITokenSafelist, OwnableUpgradeable {
  // Safelisted tokens
  mapping(address => bool) public safelistedTokens;

  function initialize() public initializer {
    __Ownable_init();
  }

  function safelistToken(address token) external onlyOwner {
    require(!safelistedTokens[token], "Already safelisted");
    safelistedTokens[token] = true;
  }

  function unSafelistToken(address token) external onlyOwner {
    require(safelistedTokens[token], "Not safelisted");
    safelistedTokens[token] = false;
  }

  function isTokenSafelisted(address token)
    external
    view
    override
    returns (bool)
  {
    return safelistedTokens[token];
  }
}
