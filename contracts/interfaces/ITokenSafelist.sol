// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface ITokenSafelist {
  function isTokenSafelisted(address token) external returns (bool);
}
