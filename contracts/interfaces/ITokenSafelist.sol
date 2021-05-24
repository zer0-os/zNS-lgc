// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

interface ITokenSafelist {
  function isTokenSafelisted(address token) external returns (bool);
}
