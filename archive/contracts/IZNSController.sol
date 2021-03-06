pragma solidity ^0.7.6;

interface IZNSController {
    function onSetZnsController(
        address sender,
        address oldController,
        uint256 id,
        bytes memory data
    ) external returns (bytes4);
}
