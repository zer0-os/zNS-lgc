pragma solidity ^0.7.6;

import "./IZNSController.sol";
import "./NonupgradeableProxy.sol";
import "./bancor/token/interfaces/IERC20Token.sol";
import "./bancor/token/interfaces/IDSTokenProxyable.sol";
import "./bancor/converter/interfaces/IDynamicLiquidTokenConverterProxyable.sol";
import "./StakingController.sol";
import "./Registry.sol";

contract DynamicTokenController is IZNSController {
    mapping (uint256 => address) public tokens;
    mapping (uint256 => address) public converters;
    address public DSTokenImplementation;
    address public DynamicConverterImplementation;
    address public bancorRegistry;
    StakingController public stakingController;
    Registry public registry;
    constructor(address _dsImpl, address _dconvImpl, StakingController _stakingController, Registry _registry) {
        DSTokenImplementation = _dsImpl;
        DynamicConverterImplementation = _dconvImpl;
    }
    function onSetZnsController(
        address sender,
        address oldController,
        uint256 id,
        bytes memory data
    ) external override returns (bytes4) {
        (
            address reserve,
            uint32 initWeight,
            uint32 stepWeight,
            uint32 minWeight,
            uint256 minBid,
            uint256 mcapThreshold,
            string memory name,
            string memory symbol
        ) = abi.decode(data, (address, uint32, uint32, uint32, uint256, uint256, string, string));
        IDSTokenProxyable tokenProxy = IDSTokenProxyable(
            address(new NonupgradeableProxy(DSTokenImplementation))
        );
        tokenProxy.initialize(name, symbol, 18);
        IDynamicLiquidTokenConverterProxyable converterProxy = IDynamicLiquidTokenConverterProxyable(
            address(new NonupgradeableProxy(DynamicConverterImplementation))
        );
        converterProxy.initialize(address(tokenProxy), bancorRegistry, 0);
        converterProxy.addReserve(IERC20Token(reserve), initWeight);
        converterProxy.setStepWeight(stepWeight);
        converterProxy.setMinimumWeight(minWeight);
        converterProxy.setMarketCapThreshold(mcapThreshold);
        converters[id] = address(converterProxy);
        tokens[id] = address(tokenProxy);
        registry.setController(id, address(stakingController));
        stakingController.configureDomain(id, address(tokenProxy), minBid);
        return this.onSetZnsController.selector;
    }
}
