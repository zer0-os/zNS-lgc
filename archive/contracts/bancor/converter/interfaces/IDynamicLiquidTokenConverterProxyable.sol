pragma solidity >=0.4.24 <0.8.0;

import "./IDynamicLiquidTokenConverter.sol";

interface IDynamicLiquidTokenConverterProxyable is IDynamicLiquidTokenConverter {
 function initialize(
        address _token,
        address _registry,
        uint32 _maxConversionFee
    ) external;
}
