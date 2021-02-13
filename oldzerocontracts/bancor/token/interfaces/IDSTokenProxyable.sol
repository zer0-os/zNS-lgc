// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity >=0.4.24 <0.8.0;

import "./IDSToken.sol";

interface IDSTokenProxyable is IDSToken {
    function initialize(
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) external;
}
