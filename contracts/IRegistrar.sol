pragma solidity 0.7.6;

interface IRegistrar {
    function canCreate(uint256 tokenId, address _owner, address _controller) external view returns (bool);
    function setController() external view;
    function setSubController() external view;
}