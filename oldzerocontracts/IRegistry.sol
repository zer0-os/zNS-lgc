pragma solidity ^0.7.6;

interface IRegistry {
    function getChildLength(uint256) external view returns (uint256);

    function getDepth(uint256) external view returns (uint256);
}
