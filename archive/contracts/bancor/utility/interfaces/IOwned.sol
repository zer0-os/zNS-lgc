// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity >=0.4.24 <0.8.0;

/*
    Owned contract interface
*/
interface IOwned {
    // this function isn't since the compiler emits automatically generated getter functions as external
    function owner() external view returns (address);

    function transferOwnership(address _newOwner) external;
    function acceptOwnership() external;
}
