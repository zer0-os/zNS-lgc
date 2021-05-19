// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import {ITokenSafelist} from "./interfaces/ITokenSafelist.sol";

contract TokenSafelist is ITokenSafelist {
  function isTokenSafelisted(address token)
    external
    pure
    override
    returns (bool)
  {
    return false;
  }
}
