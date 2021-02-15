pragma solidity ^0.7.6;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./IZNSController.sol";
import "./NonupgradeableProxy.sol";
import "./bancor/token/interfaces/IERC20Token.sol";
import "./bancor/token/interfaces/IDSTokenProxyable.sol";
import "./bancor/converter/interfaces/IDynamicLiquidTokenConverterProxyable.sol";
import "./StakingController.sol";
import "./ZNSRegistry.sol";

contract DynamicTokenController is IZNSController, OwnableUpgradeable {
    using Address for address payable;
    using SafeERC20 for IERC20;
    mapping(uint256 => IDSTokenProxyable) public tokens;
    mapping(uint256 => IDynamicLiquidTokenConverterProxyable) public converters;
    address public dsTokenImplementation;
    address public dynamicConverterImplementation;
    address public bancorRegistry;
    address constant ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    StakingController public stakingController;
    ZNSRegistry public registry;
    bool receivingEth;

    event DynamicTokenCreated(
        uint256 indexed id,
        address indexed reserve,
        address dsToken,
        address converter
    );
    event DynamicConverterUpgraded(
        uint256 indexed id,
        address indexed reserve,
        address indexed dsToken,
        address oldConverter,
        address newConverter
    );

    function initialize(
        address _dsImpl,
        address _dconvImpl,
        StakingController _stakingController,
        ZNSRegistry _registry,
        address _bancorRegistry
    ) public initializer {
        __Ownable_init();
        receivingEth = false;
        dsTokenImplementation = _dsImpl;
        registry = _registry;
        dynamicConverterImplementation = _dconvImpl;
        bancorRegistry = _bancorRegistry;
    }

    function setBancorRegistry(address _registry) external onlyOwner {
        bancorRegistry = _registry;
    }

    function setDSTokenImplementation(address _impl) external onlyOwner {
        dsTokenImplementation = _impl;
    }

    function setDynamicConverterImplemenation(address _impl)
        external
        onlyOwner
    {
        dynamicConverterImplementation = _impl;
    }

    function reduceWeightTo(
        uint256 id,
        address reserveToken,
        address payable _to
    ) public {
        require(registry.ownerOf(id) == msg.sender);
        IDynamicLiquidTokenConverterProxyable converter = converters[id];
        converter.reduceWeight(reserveToken, _to);
    }

    function reduceWeight(uint256 id, address reserveToken) public {
        reduceWeightTo(id, reserveToken, msg.sender);
    }

    function upgradeConverter(uint256 id) external {
        require(registry.ownerOf(id) == msg.sender);
        IDynamicLiquidTokenConverterProxyable oldConverter = converters[id];
        require(
            NonupgradeableProxy(address(oldConverter)).implementation() !=
                dynamicConverterImplementation
        );
        address anchor = address(oldConverter.anchor());
        IERC20Token reserve = oldConverter.reserveTokens(0);
        (, uint32 weight) = oldConverter.getReserve(reserve);
        IDynamicLiquidTokenConverterProxyable converterProxy =
            _createConverter(
                address(reserve),
                anchor,
                weight,
                oldConverter.stepWeight(),
                oldConverter.minimumWeight(),
                oldConverter.marketCapThreshold()
            );
        if (address(reserve) == ETH_ADDRESS) {
            oldConverter.withdrawETH(address(converterProxy));
        } else {
            oldConverter.withdrawTokens(
                reserve,
                address(converterProxy),
                reserve.balanceOf(address(oldConverter))
            );
        }
        oldConverter.transferAnchorOwnership(address(converterProxy));
        converterProxy.acceptAnchorOwnership();
        converters[id] = converterProxy;
        emit DynamicConverterUpgraded(
            id,
            address(reserve),
            anchor,
            address(oldConverter),
            address(converterProxy)
        );
    }

    function _createConverter(
        address reserve,
        address token,
        uint32 weight,
        uint32 stepWeight,
        uint32 minWeight,
        uint256 mcapThreshold
    ) internal returns (IDynamicLiquidTokenConverterProxyable) {
        IDynamicLiquidTokenConverterProxyable converterProxy =
            IDynamicLiquidTokenConverterProxyable(
                address(new NonupgradeableProxy(dynamicConverterImplementation))
            );
        converterProxy.initialize(token, bancorRegistry, 0);
        converterProxy.addReserve(IERC20Token(reserve), weight);
        converterProxy.setStepWeight(stepWeight);
        converterProxy.setMinimumWeight(minWeight);
        converterProxy.setMarketCapThreshold(mcapThreshold);
        return converterProxy;
    }

    function _configureDynamicController(
        uint256 id,
        address reserve,
        uint32 initWeight,
        uint32 stepWeight,
        uint32 minWeight,
        uint256 mcapThreshold,
        uint256 minBid,
        string memory name,
        string memory symbol
    ) internal {
        require(registry.controllerOf(id) == address(this));
        IDSTokenProxyable tokenProxy =
            IDSTokenProxyable(
                address(new NonupgradeableProxy(dsTokenImplementation))
            );
        tokenProxy.initialize(name, symbol, 18);
        IDynamicLiquidTokenConverterProxyable converterProxy =
            _createConverter(
                reserve,
                address(tokenProxy),
                initWeight,
                stepWeight,
                minWeight,
                mcapThreshold
            );
        tokenProxy.transferOwnership(address(converterProxy));
        converterProxy.acceptAnchorOwnership();
        converters[id] = converterProxy;
        tokens[id] = tokenProxy;
        registry.safeSetController(
            id,
            address(stakingController),
            abi.encode(address(tokenProxy), minBid)
        );
        emit DynamicTokenCreated(id, reserve, address(tokenProxy), address(converterProxy));
    }


    function configureDynamicController(
        uint256 id,
        address reserve,
        uint32 initWeight,
        uint32 stepWeight,
        uint32 minWeight,
        uint256 mcapThreshold,
        uint256 minBid,
        string memory name,
        string memory symbol
    ) public {
        require(msg.sender == registry.ownerOf(id));
        require(address(tokens[id]) == address(0));
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
            uint256 mcapThreshold,
            uint256 minBid,
            string memory name,
            string memory symbol
        ) =
            abi.decode(
                data,
                (
                    address,
                    uint32,
                    uint32,
                    uint32,
                    uint256,
                    uint256,
                    string,
                    string
                )
            );
        _configureDynamicController(
            id,
            reserve,
            initWeight,
            stepWeight,
            minWeight,
            mcapThreshold,
            minBid,
            name,
            symbol
        );
        return this.onSetZnsController.selector;
    }

    receive() external payable {
        require(receivingEth);
    }
}
