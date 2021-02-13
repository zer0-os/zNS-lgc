// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.6.12;
import "./interfaces/IConverter.sol";
import "./interfaces/IConverterUpgrader.sol";
import "./interfaces/IConverterFactory.sol";
import "../utility/ContractRegistryClient.sol";
import "../utility/interfaces/IWhitelist.sol";
import "../token/interfaces/IEtherToken.sol";
import "./types/liquidity-pool-v2/interfaces/ILiquidityPoolV2Converter.sol";

/**
  * @dev Converter Upgrader
  *
  * The converter upgrader contract allows upgrading an older converter contract (0.4 and up)
  * to the latest version.
  * To begin the upgrade process, simply execute the 'upgrade' function.
  * At the end of the process, the ownership of the newly upgraded converter will be transferred
  * back to the original owner and the original owner will need to execute the 'acceptOwnership' function.
  *
  * The address of the new converter is available in the ConverterUpgrade event.
  *
  * Note that for older converters that don't yet have the 'upgrade' function, ownership should first
  * be transferred manually to the ConverterUpgrader contract using the 'transferOwnership' function
  * and then the upgrader 'upgrade' function should be executed directly.
*/
contract ConverterUpgrader is IConverterUpgrader, ContractRegistryClient {
    IERC20Token private constant ETH_RESERVE_ADDRESS = IERC20Token(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
    IEtherToken public etherToken;

    /**
      * @dev triggered when the contract accept a converter ownership
      *
      * @param _converter   converter address
      * @param _owner       new owner - local upgrader address
    */
    event ConverterOwned(IConverter indexed _converter, address indexed _owner);

    /**
      * @dev triggered when the upgrading process is done
      *
      * @param _oldConverter    old converter address
      * @param _newConverter    new converter address
    */
    event ConverterUpgrade(address indexed _oldConverter, address indexed _newConverter);

    /**
      * @dev initializes a new ConverterUpgrader instance
      *
      * @param _registry    address of a contract registry contract
    */
    constructor(IContractRegistry _registry, IEtherToken _etherToken) ContractRegistryClient(_registry) public {
        etherToken = _etherToken;
    }

    /**
      * @dev upgrades an old converter to the latest version
      * will throw if ownership wasn't transferred to the upgrader before calling this function.
      * ownership of the new converter will be transferred back to the original owner.
      * fires the ConverterUpgrade event upon success.
      * can only be called by a converter
      *
      * @param _version old converter version
    */
    function upgrade(bytes32 _version) public override {
        upgradeOld(IConverter(msg.sender), _version);
    }

    /**
      * @dev upgrades an old converter to the latest version
      * will throw if ownership wasn't transferred to the upgrader before calling this function.
      * ownership of the new converter will be transferred back to the original owner.
      * fires the ConverterUpgrade event upon success.
      * can only be called by a converter
      *
      * @param _version old converter version
    */
    function upgrade(uint16 _version) public override {
        upgradeOld(IConverter(msg.sender), bytes32(uint256(_version)));
    }

    /**
      * @dev upgrades an old converter to the latest version
      * will throw if ownership wasn't transferred to the upgrader before calling this function.
      * ownership of the new converter will be transferred back to the original owner.
      * fires the ConverterUpgrade event upon success.
      *
      * @param _converter   old converter contract address
      * @param _version     old converter version
    */
    function upgradeOld(IConverter _converter, bytes32 _version) public {
        _version;
        IConverter converter = IConverter(_converter);
        address prevOwner = converter.owner();
        acceptConverterOwnership(converter);
        IConverter newConverter = createConverter(converter);
        copyReserves(converter, newConverter);
        copyConversionFee(converter, newConverter);
        transferReserveBalances(converter, newConverter);
        IConverterAnchor anchor = converter.token();

        // get the activation status before it's being invalidated
        bool activate = isV28OrHigherConverter(converter) && converter.isActive();

        if (anchor.owner() == address(converter)) {
            converter.transferTokenOwnership(address(newConverter));
            newConverter.acceptAnchorOwnership();
        }

        handleTypeSpecificData(converter, newConverter, activate);

        converter.transferOwnership(prevOwner);
        newConverter.transferOwnership(prevOwner);

        emit ConverterUpgrade(address(converter), address(newConverter));
    }

    /**
      * @dev the first step when upgrading a converter is to transfer the ownership to the local contract.
      * the upgrader contract then needs to accept the ownership transfer before initiating
      * the upgrade process.
      * fires the ConverterOwned event upon success
      *
      * @param _oldConverter       converter to accept ownership of
    */
    function acceptConverterOwnership(IConverter _oldConverter) private {
        _oldConverter.acceptOwnership();
        emit ConverterOwned(_oldConverter, address(this));
    }

    /**
      * @dev creates a new converter with same basic data as the original old converter
      * the newly created converter will have no reserves at this step.
      *
      * @param _oldConverter    old converter contract address
      *
      * @return the new converter  new converter contract address
    */
    function createConverter(IConverter _oldConverter) private returns (IConverter) {
        IConverterAnchor anchor = _oldConverter.token();
        uint32 maxConversionFee = _oldConverter.maxConversionFee();
        uint16 reserveTokenCount = _oldConverter.connectorTokenCount();

        // determine new converter type
        uint16 newType = 0;
        // new converter - get the type from the converter itself
        if (isV28OrHigherConverter(_oldConverter))
            newType = _oldConverter.converterType();
        // old converter - if it has 1 reserve token, the type is a liquid token, otherwise the type liquidity pool
        else if (reserveTokenCount > 1)
            newType = 1;

        IConverterFactory converterFactory = IConverterFactory(addressOf(CONVERTER_FACTORY));
        IConverter converter = converterFactory.createConverter(newType, anchor, registry, maxConversionFee);

        converter.acceptOwnership();
        return converter;
    }

    /**
      * @dev copies the reserves from the old converter to the new one.
      * note that this will not work for an unlimited number of reserves due to block gas limit constraints.
      *
      * @param _oldConverter    old converter contract address
      * @param _newConverter    new converter contract address
    */
    function copyReserves(IConverter _oldConverter, IConverter _newConverter) private {
        uint16 reserveTokenCount = _oldConverter.connectorTokenCount();

        for (uint16 i = 0; i < reserveTokenCount; i++) {
            IERC20Token reserveAddress = _oldConverter.connectorTokens(i);
            (, uint32 weight, , , ) = _oldConverter.connectors(reserveAddress);

            // Ether reserve
            if (reserveAddress == ETH_RESERVE_ADDRESS) {
                _newConverter.addReserve(ETH_RESERVE_ADDRESS, weight);
            }
            // Ether reserve token
            else if (reserveAddress == etherToken) {
                _newConverter.addReserve(ETH_RESERVE_ADDRESS, weight);
            }
            // ERC20 reserve token
            else {
                _newConverter.addReserve(reserveAddress, weight);
            }
        }
    }

    /**
      * @dev copies the conversion fee from the old converter to the new one
      *
      * @param _oldConverter    old converter contract address
      * @param _newConverter    new converter contract address
    */
    function copyConversionFee(IConverter _oldConverter, IConverter _newConverter) private {
        uint32 conversionFee = _oldConverter.conversionFee();
        _newConverter.setConversionFee(conversionFee);
    }

    /**
      * @dev transfers the balance of each reserve in the old converter to the new one.
      * note that the function assumes that the new converter already has the exact same number of
      * also, this will not work for an unlimited number of reserves due to block gas limit constraints.
      *
      * @param _oldConverter    old converter contract address
      * @param _newConverter    new converter contract address
    */
    function transferReserveBalances(IConverter _oldConverter, IConverter _newConverter) private {
        uint256 reserveBalance;
        uint16 reserveTokenCount = _oldConverter.connectorTokenCount();

        for (uint16 i = 0; i < reserveTokenCount; i++) {
            IERC20Token reserveAddress = _oldConverter.connectorTokens(i);
            // Ether reserve
            if (reserveAddress == ETH_RESERVE_ADDRESS) {
                _oldConverter.withdrawETH(address(_newConverter));
            }
            // Ether reserve token
            else if (reserveAddress == etherToken) {
                reserveBalance = etherToken.balanceOf(address(_oldConverter));
                _oldConverter.withdrawTokens(etherToken, address(this), reserveBalance);
                etherToken.withdrawTo(address(_newConverter), reserveBalance);
            }
            // ERC20 reserve token
            else {
                IERC20Token connector = reserveAddress;
                reserveBalance = connector.balanceOf(address(_oldConverter));
                _oldConverter.withdrawTokens(connector, address(_newConverter), reserveBalance);
            }
        }
    }

    /**
      * @dev handles upgrading custom (type specific) data from the old converter to the new one
      *
      * @param _oldConverter    old converter contract address
      * @param _newConverter    new converter contract address
      * @param _activate        activate the new converter
    */
    function handleTypeSpecificData(IConverter _oldConverter, IConverter _newConverter, bool _activate) private {
        if (!isV28OrHigherConverter(_oldConverter))
            return;

        uint16 converterType = _oldConverter.converterType();
        if (converterType == 2) {
            ILiquidityPoolV2Converter oldConverter = ILiquidityPoolV2Converter(address(_oldConverter));
            ILiquidityPoolV2Converter newConverter = ILiquidityPoolV2Converter(address(_newConverter));

            uint16 reserveTokenCount = oldConverter.connectorTokenCount();
            for (uint16 i = 0; i < reserveTokenCount; i++) {
                // copy reserve staked balance
                IERC20Token reserveTokenAddress = oldConverter.connectorTokens(i);
                uint256 balance = oldConverter.reserveStakedBalance(reserveTokenAddress);
                newConverter.setReserveStakedBalance(reserveTokenAddress, balance);
            }

            if (!_activate) {
                return;
            }

            // get the primary reserve token
            IERC20Token primaryReserveToken = oldConverter.primaryReserveToken();

            // get the chainlink price oracles
            IPriceOracle priceOracle = oldConverter.priceOracle();
            IChainlinkPriceOracle oracleA = priceOracle.tokenAOracle();
            IChainlinkPriceOracle oracleB = priceOracle.tokenBOracle();

            // activate the new converter
            newConverter.activate(primaryReserveToken, oracleA, oracleB);
        }
    }

    bytes4 private constant IS_V28_OR_HIGHER_FUNC_SELECTOR = bytes4(keccak256("isV28OrHigher()"));

    // using a static call to identify converter version
    // can't rely on the version number since the function had a different signature in older converters
    function isV28OrHigherConverter(IConverter _converter) internal view returns (bool) {
        bytes memory data = abi.encodeWithSelector(IS_V28_OR_HIGHER_FUNC_SELECTOR);
        (bool success, bytes memory returnData) = address(_converter).staticcall{ gas: 4000 }(data);

        if (success && returnData.length == 32) {
            return abi.decode(returnData, (bool));
        }

        return false;
    }
}
