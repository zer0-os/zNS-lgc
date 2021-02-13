// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity >=0.4.24 <0.8.0;

/*
    Whitelist interface
*/
interface IWhitelist {
    function isWhitelisted(address _address) external view returns (bool);
}
