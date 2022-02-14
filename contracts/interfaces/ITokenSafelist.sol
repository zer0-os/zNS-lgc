// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

interface ITokenSafelist {
  function isTokenSafelisted(address token) external returns (bool);
}
