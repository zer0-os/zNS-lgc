// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {Ownable} from "../oz/access/Ownable.sol";
import "../interfaces/IRegistrar.sol";

contract MockController is Ownable {
  IRegistrar public registrar;

  constructor(IRegistrar registrar_) {
    registrar = registrar_;
  }

  function setRegistrar(IRegistrar registrar_) external onlyOwner {
    registrar = registrar_;
  }

  function registerDomainAndSend(
    uint256 parentId,
    string memory label,
    address minter,
    string memory metadataUri,
    uint256 royaltyAmount,
    bool locked,
    address sendToUser
  ) external returns (uint256) {
    return
      registrar.registerDomainAndSend(
        parentId,
        label,
        minter,
        metadataUri,
        royaltyAmount,
        locked,
        sendToUser
      );
  }

  function registerSubdomainContract(
    uint256 parentId,
    string memory label,
    address minter,
    string memory metadataUri,
    uint256 royaltyAmount,
    bool locked,
    address sendToUser
  ) external returns (uint256) {
    return
      registrar.registerSubdomainContract(
        parentId,
        label,
        minter,
        metadataUri,
        royaltyAmount,
        locked,
        sendToUser
      );
  }
}
