pragma solidity >=0.4.24 <0.8.0;

import "./ILiquidTokenConverter.sol";

interface IDynamicLiquidTokenConverter is ILiquidTokenConverter {
    /**
     * @dev updates the market cap threshold
     * can only be called by the owner while inactive
     *
     * @param _marketCapThreshold new threshold
     */
    function setMarketCapThreshold(uint256 _marketCapThreshold) external;

    /**
     * @dev updates the current minimum weight
     * can only be called by the owner while inactive
     *
     * @param _minimumWeight new minimum weight, represented in ppm
     */
    function setMinimumWeight(uint32 _minimumWeight) external;

    /**
     * @dev updates the current step weight
     * can only be called by the owner while inactive
     *
     * @param _stepWeight new step weight, represented in ppm
     */
    function setStepWeight(uint32 _stepWeight) external;

    /**
     * @dev updates the token reserve weight
     * can only be called by the owner
     *
     * @param _reserveToken    address of the reserve token
     */
    function reduceWeight(address _reserveToken) external;

    function getMarketCap(address _reserveToken) external;
}
