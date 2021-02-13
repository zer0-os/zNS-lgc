// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.6.12;
import "./IConversionPathFinder.sol";
import "./converter/interfaces/IConverter.sol";
import "./converter/interfaces/IConverterAnchor.sol";
import "./converter/interfaces/IBancorFormula.sol";
import "./utility/ContractRegistryClient.sol";
import "./utility/ReentrancyGuard.sol";
import "./utility/TokenHolder.sol";
import "./utility/SafeMath.sol";
import "./token/interfaces/IEtherToken.sol";
import "./token/interfaces/IDSToken.sol";
import "./bancorx/interfaces/IBancorX.sol";

// interface of older converters for backward compatibility
interface ILegacyConverter {
    function change(IERC20Token _sourceToken, IERC20Token _targetToken, uint256 _amount, uint256 _minReturn) external returns (uint256);
}

/**
  * @dev The BancorNetwork contract is the main entry point for Bancor token conversions.
  * It also allows for the conversion of any token in the Bancor Network to any other token in a single
  * transaction by providing a conversion path.
  *
  * A note on Conversion Path: Conversion path is a data structure that is used when converting a token
  * to another token in the Bancor Network, when the conversion cannot necessarily be done by a single
  * converter and might require multiple 'hops'.
  * The path defines which converters should be used and what kind of conversion should be done in each step.
  *
  * The path format doesn't include complex structure; instead, it is represented by a single array
  * in which each 'hop' is represented by a 2-tuple - converter anchor & target token.
  * In addition, the first element is always the source token.
  * The converter anchor is only used as a pointer to a converter (since converter addresses are more
  * likely to change as opposed to anchor addresses).
  *
  * Format:
  * [source token, converter anchor, target token, converter anchor, target token...]
*/
contract BancorNetwork is TokenHolder, ContractRegistryClient, ReentrancyGuard {
    using SafeMath for uint256;

    uint256 private constant PPM_RESOLUTION = 1000000;
    IERC20Token private constant ETH_RESERVE_ADDRESS = IERC20Token(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);

    struct ConversionStep {
        IConverter converter;
        IConverterAnchor anchor;
        IERC20Token sourceToken;
        IERC20Token targetToken;
        address payable beneficiary;
        bool isV28OrHigherConverter;
        bool processAffiliateFee;
    }

    uint256 public maxAffiliateFee = 30000;     // maximum affiliate-fee

    mapping (IERC20Token => bool) public etherTokens;   // list of all supported ether tokens

    /**
      * @dev triggered when a conversion between two tokens occurs
      *
      * @param _smartToken  anchor governed by the converter
      * @param _fromToken   source ERC20 token
      * @param _toToken     target ERC20 token
      * @param _fromAmount  amount converted, in the source token
      * @param _toAmount    amount returned, minus conversion fee
      * @param _trader      wallet that initiated the trade
    */
    event Conversion(
        IConverterAnchor indexed _smartToken,
        IERC20Token indexed _fromToken,
        IERC20Token indexed _toToken,
        uint256 _fromAmount,
        uint256 _toAmount,
        address _trader
    );

    /**
      * @dev initializes a new BancorNetwork instance
      *
      * @param _registry    address of a contract registry contract
    */
    constructor(IContractRegistry _registry) ContractRegistryClient(_registry) public {
        etherTokens[ETH_RESERVE_ADDRESS] = true;
    }

    /**
      * @dev allows the owner to update the maximum affiliate-fee
      *
      * @param _maxAffiliateFee   maximum affiliate-fee
    */
    function setMaxAffiliateFee(uint256 _maxAffiliateFee)
        public
        ownerOnly
    {
        require(_maxAffiliateFee <= PPM_RESOLUTION, "ERR_INVALID_AFFILIATE_FEE");
        maxAffiliateFee = _maxAffiliateFee;
    }

    /**
      * @dev allows the owner to register/unregister ether tokens
      *
      * @param _token       ether token contract address
      * @param _register    true to register, false to unregister
    */
    function registerEtherToken(IEtherToken _token, bool _register)
        public
        ownerOnly
        validAddress(address(_token))
        notThis(address(_token))
    {
        etherTokens[_token] = _register;
    }

    /**
      * @dev returns the conversion path between two tokens in the network
      * note that this method is quite expensive in terms of gas and should generally be called off-chain
      *
      * @param _sourceToken source token address
      * @param _targetToken target token address
      *
      * @return conversion path between the two tokens
    */
    function conversionPath(IERC20Token _sourceToken, IERC20Token _targetToken) public view returns (address[] memory) {
        IConversionPathFinder pathFinder = IConversionPathFinder(addressOf(CONVERSION_PATH_FINDER));
        return pathFinder.findPath(_sourceToken, _targetToken);
    }

    /**
      * @dev returns the expected target amount of converting a given amount on a given path
      * note that there is no support for circular paths
      *
      * @param _path        conversion path (see conversion path format above)
      * @param _amount      amount of _path[0] tokens received from the sender
      *
      * @return expected target amount
    */
    function rateByPath(address[] memory _path, uint256 _amount) public view returns (uint256) {
        uint256 amount;
        uint256 fee;
        uint256 supply;
        uint256 balance;
        uint32 weight;
        IConverter converter;
        IBancorFormula formula = IBancorFormula(addressOf(BANCOR_FORMULA));

        amount = _amount;

        // verify that the number of elements is larger than 2 and odd
        require(_path.length > 2 && _path.length % 2 == 1, "ERR_INVALID_PATH");

        // iterate over the conversion path
        for (uint256 i = 2; i < _path.length; i += 2) {
            IERC20Token sourceToken = IERC20Token(_path[i - 2]);
            address anchor = _path[i - 1];
            IERC20Token targetToken = IERC20Token(_path[i]);

            converter = IConverter(payable(IConverterAnchor(anchor).owner()));

            // backward compatibility
            sourceToken = getConverterTokenAddress(converter, sourceToken);
            targetToken = getConverterTokenAddress(converter, targetToken);

            if (address(targetToken) == anchor) { // buy the anchor
                // check if the current anchor has changed
                if (i < 3 || anchor != _path[i - 3])
                    supply = IDSToken(anchor).totalSupply();

                // get the amount & the conversion fee
                balance = converter.getConnectorBalance(sourceToken);
                (, weight, , , ) = converter.connectors(sourceToken);
                amount = formula.purchaseTargetAmount(supply, balance, weight, amount);
                fee = amount.mul(converter.conversionFee()).div(PPM_RESOLUTION);
                amount -= fee;

                // update the anchor supply for the next iteration
                supply = supply.add(amount);
            }
            else if (address(sourceToken) == anchor) { // sell the anchor
                // check if the current anchor has changed
                if (i < 3 || anchor != _path[i - 3])
                    supply = IDSToken(anchor).totalSupply();

                // get the amount & the conversion fee
                balance = converter.getConnectorBalance(targetToken);
                (, weight, , , ) = converter.connectors(targetToken);
                amount = formula.saleTargetAmount(supply, balance, weight, amount);
                fee = amount.mul(converter.conversionFee()).div(PPM_RESOLUTION);
                amount -= fee;

                // update the anchor supply for the next iteration
                supply = supply.sub(amount);
            }
            else { // cross reserve conversion
                (amount, fee) = getReturn(converter, sourceToken, targetToken, amount);
            }
        }

        return amount;
    }

    /**
      * @dev converts the token to any other token in the bancor network by following
      * a predefined conversion path and transfers the result tokens to a target account
      * affiliate account/fee can also be passed in to receive a conversion fee (on top of the liquidity provider fees)
      * note that the network should already have been given allowance of the source token (if not ETH)
      *
      * @param _path                conversion path, see conversion path format above
      * @param _amount              amount to convert from, in the source token
      * @param _minReturn           if the conversion results in an amount smaller than the minimum return - it is cancelled, must be greater than zero
      * @param _beneficiary         account that will receive the conversion result or 0x0 to send the result to the sender account
      * @param _affiliateAccount    wallet address to receive the affiliate fee or 0x0 to disable affiliate fee
      * @param _affiliateFee        affiliate fee in PPM or 0 to disable affiliate fee
      *
      * @return amount of tokens received from the conversion
    */
    function convertByPath(
        address[] memory _path,
        uint256 _amount,
        uint256 _minReturn,
        address payable _beneficiary,
        address _affiliateAccount,
        uint256 _affiliateFee)
        public
        payable
        protected
        greaterThanZero(_minReturn)
        returns (uint256)
    {
        // verify that the path contrains at least a single 'hop' and that the number of elements is odd
        require(_path.length > 2 && _path.length % 2 == 1, "ERR_INVALID_PATH");

        // validate msg.value and prepare the source token for the conversion
        handleSourceToken(IERC20Token(_path[0]), IConverterAnchor(_path[1]), _amount);

        // check if affiliate fee is enabled
        bool affiliateFeeEnabled = false;
        if (address(_affiliateAccount) == address(0)) {
            require(_affiliateFee == 0, "ERR_INVALID_AFFILIATE_FEE");
        }
        else {
            require(0 < _affiliateFee && _affiliateFee <= maxAffiliateFee, "ERR_INVALID_AFFILIATE_FEE");
            affiliateFeeEnabled = true;
        }

        // check if beneficiary is set
        address payable beneficiary = msg.sender;
        if (_beneficiary != address(0))
            beneficiary = _beneficiary;

        // convert and get the resulting amount
        ConversionStep[] memory data = createConversionData(_path, beneficiary, affiliateFeeEnabled);
        uint256 amount = doConversion(data, _amount, _minReturn, _affiliateAccount, _affiliateFee);

        // handle the conversion target tokens
        handleTargetToken(data, amount, beneficiary);

        return amount;
    }

    /**
      * @dev converts any other token to BNT in the bancor network by following
      a predefined conversion path and transfers the result to an account on a different blockchain
      * note that the network should already have been given allowance of the source token (if not ETH)
      *
      * @param _path                conversion path, see conversion path format above
      * @param _amount              amount to convert from, in the source token
      * @param _minReturn           if the conversion results in an amount smaller than the minimum return - it is cancelled, must be greater than zero
      * @param _targetBlockchain    blockchain BNT will be issued on
      * @param _targetAccount       address/account on the target blockchain to send the BNT to
      * @param _conversionId        pre-determined unique (if non zero) id which refers to this transaction
      *
      * @return the amount of BNT received from this conversion
    */
    function xConvert(
        address[] memory _path,
        uint256 _amount,
        uint256 _minReturn,
        bytes32 _targetBlockchain,
        bytes32 _targetAccount,
        uint256 _conversionId
    )
        public
        payable
        returns (uint256)
    {
        return xConvert2(_path, _amount, _minReturn, _targetBlockchain, _targetAccount, _conversionId, address(0), 0);
    }

    /**
      * @dev converts any other token to BNT in the bancor network by following
      a predefined conversion path and transfers the result to an account on a different blockchain
      * note that the network should already have been given allowance of the source token (if not ETH)
      *
      * @param _path                conversion path, see conversion path format above
      * @param _amount              amount to convert from, in the source token
      * @param _minReturn           if the conversion results in an amount smaller than the minimum return - it is cancelled, must be greater than zero
      * @param _targetBlockchain    blockchain BNT will be issued on
      * @param _targetAccount       address/account on the target blockchain to send the BNT to
      * @param _conversionId        pre-determined unique (if non zero) id which refers to this transaction
      * @param _affiliateAccount    affiliate account
      * @param _affiliateFee        affiliate fee in PPM
      *
      * @return the amount of BNT received from this conversion
    */
    function xConvert2(
        address[] memory _path,
        uint256 _amount,
        uint256 _minReturn,
        bytes32 _targetBlockchain,
        bytes32 _targetAccount,
        uint256 _conversionId,
        address _affiliateAccount,
        uint256 _affiliateFee
    )
        public
        payable
        greaterThanZero(_minReturn)
        returns (uint256)
    {
        IERC20Token targetToken = IERC20Token(_path[_path.length - 1]);
        IBancorX bancorX = IBancorX(addressOf(BANCOR_X));

        // verify that the destination token is BNT
        require(targetToken == IERC20Token(addressOf(BNT_TOKEN)), "ERR_INVALID_TARGET_TOKEN");

        // convert and get the resulting amount
        uint256 amount = convertByPath(_path, _amount, _minReturn, payable(address(this)), _affiliateAccount, _affiliateFee);

        // grant BancorX allowance
        ensureAllowance(targetToken, address(bancorX), amount);

        // transfer the resulting amount to BancorX
        bancorX.xTransfer(_targetBlockchain, _targetAccount, amount, _conversionId);

        return amount;
    }

    /**
      * @dev allows a user to convert a token that was sent from another blockchain into any other
      * token on the BancorNetwork
      * ideally this transaction is created before the previous conversion is even complete, so
      * so the input amount isn't known at that point - the amount is actually take from the
      * BancorX contract directly by specifying the conversion id
      *
      * @param _path            conversion path
      * @param _bancorX         address of the BancorX contract for the source token
      * @param _conversionId    pre-determined unique (if non zero) id which refers to this conversion
      * @param _minReturn       if the conversion results in an amount smaller than the minimum return - it is cancelled, must be nonzero
      * @param _beneficiary     wallet to receive the conversion result
      *
      * @return amount of tokens received from the conversion
    */
    function completeXConversion(address[] memory _path, IBancorX _bancorX, uint256 _conversionId, uint256 _minReturn, address payable _beneficiary)
        public returns (uint256)
    {
        // verify that the source token is the BancorX token
        require(IERC20Token(_path[0]) == _bancorX.token(), "ERR_INVALID_SOURCE_TOKEN");

        // get conversion amount from BancorX contract
        uint256 amount = _bancorX.getXTransferAmount(_conversionId, msg.sender);

        // perform the conversion
        return convertByPath(_path, amount, _minReturn, _beneficiary, address(0), 0);
    }

    /**
      * @dev executes the actual conversion by following the conversion path
      *
      * @param _data                conversion data, see ConversionStep struct above
      * @param _amount              amount to convert from, in the source token
      * @param _minReturn           if the conversion results in an amount smaller than the minimum return - it is cancelled, must be greater than zero
      * @param _affiliateAccount    affiliate account
      * @param _affiliateFee        affiliate fee in PPM
      *
      * @return amount of tokens received from the conversion
    */
    function doConversion(
        ConversionStep[] memory _data,
        uint256 _amount,
        uint256 _minReturn,
        address _affiliateAccount,
        uint256 _affiliateFee
    ) private returns (uint256) {
        uint256 toAmount;
        uint256 fromAmount = _amount;

        // iterate over the conversion data
        for (uint256 i = 0; i < _data.length; i++) {
            ConversionStep memory stepData = _data[i];

            // newer converter
            if (stepData.isV28OrHigherConverter) {
                // transfer the tokens to the converter only if the network contract currently holds the tokens
                // not needed with ETH or if it's the first conversion step
                if (i != 0 && _data[i - 1].beneficiary == address(this) && !etherTokens[stepData.sourceToken])
                    safeTransfer(stepData.sourceToken, address(stepData.converter), fromAmount);
            }
            // older converter
            // if the source token is the liquid token, no need to do any transfers as the converter controls it
            else if (stepData.sourceToken != IDSToken(address(stepData.anchor))) {
                // grant allowance for it to transfer the tokens from the network contract
                ensureAllowance(stepData.sourceToken, address(stepData.converter), fromAmount);
            }

            // do the conversion
            if (!stepData.isV28OrHigherConverter)
                toAmount = ILegacyConverter(address(stepData.converter)).change(stepData.sourceToken, stepData.targetToken, fromAmount, 1);
            else if (etherTokens[stepData.sourceToken])
                toAmount = stepData.converter.convert{ value: msg.value }(stepData.sourceToken, stepData.targetToken, fromAmount, msg.sender, stepData.beneficiary);
            else
                toAmount = stepData.converter.convert(stepData.sourceToken, stepData.targetToken, fromAmount, msg.sender, stepData.beneficiary);

            // pay affiliate-fee if needed
            if (stepData.processAffiliateFee) {
                uint256 affiliateAmount = toAmount.mul(_affiliateFee).div(PPM_RESOLUTION);
                require(stepData.targetToken.transfer(_affiliateAccount, affiliateAmount), "ERR_FEE_TRANSFER_FAILED");
                toAmount -= affiliateAmount;
            }

            emit Conversion(stepData.anchor, stepData.sourceToken, stepData.targetToken, fromAmount, toAmount, msg.sender);
            fromAmount = toAmount;
        }

        // ensure the trade meets the minimum requested amount
        require(toAmount >= _minReturn, "ERR_RETURN_TOO_LOW");

        return toAmount;
    }

    /**
      * @dev validates msg.value and prepares the conversion source token for the conversion
      *
      * @param _sourceToken source token of the first conversion step
      * @param _anchor      converter anchor of the first conversion step
      * @param _amount      amount to convert from, in the source token
    */
    function handleSourceToken(IERC20Token _sourceToken, IConverterAnchor _anchor, uint256 _amount) private {
        IConverter firstConverter = IConverter(payable(_anchor.owner()));
        bool isNewerConverter = isV28OrHigherConverter(firstConverter);

        // ETH
        if (msg.value > 0) {
            // validate msg.value
            require(msg.value == _amount, "ERR_ETH_AMOUNT_MISMATCH");

            // EtherToken converter - deposit the ETH into the EtherToken
            // note that it can still be a non ETH converter if the path is wrong
            // but such conversion will simply revert
            if (!isNewerConverter)
                IEtherToken(address(getConverterEtherTokenAddress(firstConverter))).deposit{ value: msg.value }();
        }
        // EtherToken
        else if (etherTokens[_sourceToken]) {
            // claim the tokens - if the source token is ETH reserve, this call will fail
            // since in that case the transaction must be sent with msg.value
            safeTransferFrom(_sourceToken, msg.sender, address(this), _amount);

            // ETH converter - withdraw the ETH
            if (isNewerConverter)
                IEtherToken(address(_sourceToken)).withdraw(_amount);
        }
        // other ERC20 token
        else {
            // newer converter - transfer the tokens from the sender directly to the converter
            // otherwise claim the tokens
            if (isNewerConverter)
                safeTransferFrom(_sourceToken, msg.sender, address(firstConverter), _amount);
            else
                safeTransferFrom(_sourceToken, msg.sender, address(this), _amount);
        }
    }

    /**
      * @dev handles the conversion target token if the network still holds it at the end of the conversion
      *
      * @param _data        conversion data, see ConversionStep struct above
      * @param _amount      conversion target amount
      * @param _beneficiary wallet to receive the conversion result
    */
    function handleTargetToken(ConversionStep[] memory _data, uint256 _amount, address payable _beneficiary) private {
        ConversionStep memory stepData = _data[_data.length - 1];

        // network contract doesn't hold the tokens, do nothing
        if (stepData.beneficiary != address(this))
            return;

        IERC20Token targetToken = stepData.targetToken;

        // ETH / EtherToken
        if (etherTokens[targetToken]) {
            // newer converter should send ETH directly to the beneficiary
            assert(!stepData.isV28OrHigherConverter);

            // EtherToken converter - withdraw the ETH and transfer to the beneficiary
            IEtherToken(address(targetToken)).withdrawTo(_beneficiary, _amount);
        }
        // other ERC20 token
        else {
            safeTransfer(targetToken, _beneficiary, _amount);
        }
    }

    /**
      * @dev creates a memory cache of all conversion steps data to minimize logic and external calls during conversions
      *
      * @param _conversionPath      conversion path, see conversion path format above
      * @param _beneficiary         wallet to receive the conversion result
      * @param _affiliateFeeEnabled true if affiliate fee was requested by the sender, false if not
      *
      * @return cached conversion data to be ingested later on by the conversion flow
    */
    function createConversionData(address[] memory _conversionPath, address payable _beneficiary, bool _affiliateFeeEnabled) private view returns (ConversionStep[] memory) {
        ConversionStep[] memory data = new ConversionStep[](_conversionPath.length / 2);

        bool affiliateFeeProcessed = false;
        IERC20Token bntToken = IERC20Token(addressOf(BNT_TOKEN));
        // iterate the conversion path and create the conversion data for each step
        uint256 i;
        for (i = 0; i < _conversionPath.length - 1; i += 2) {
            IConverterAnchor anchor = IConverterAnchor(_conversionPath[i + 1]);
            IConverter converter = IConverter(payable(anchor.owner()));
            IERC20Token targetToken = IERC20Token(_conversionPath[i + 2]);

            // check if the affiliate fee should be processed in this step
            bool processAffiliateFee = _affiliateFeeEnabled && !affiliateFeeProcessed && targetToken == bntToken;
            if (processAffiliateFee)
                affiliateFeeProcessed = true;

            data[i / 2] = ConversionStep({
                // set the converter anchor
                anchor: anchor,

                // set the converter
                converter: converter,

                // set the source/target tokens
                sourceToken: IERC20Token(_conversionPath[i]),
                targetToken: targetToken,

                // requires knowledge about the next step, so initialize in the next phase
                beneficiary: address(0),

                // set flags
                isV28OrHigherConverter: isV28OrHigherConverter(converter),
                processAffiliateFee: processAffiliateFee
            });
        }

        // ETH support
        // source is ETH
        ConversionStep memory stepData = data[0];
        if (etherTokens[stepData.sourceToken]) {
            // newer converter - replace the source token address with ETH reserve address
            if (stepData.isV28OrHigherConverter)
                stepData.sourceToken = ETH_RESERVE_ADDRESS;
            // older converter - replace the source token with the EtherToken address used by the converter
            else
                stepData.sourceToken = getConverterEtherTokenAddress(stepData.converter);
        }

        // target is ETH
        stepData = data[data.length - 1];
        if (etherTokens[stepData.targetToken]) {
            // newer converter - replace the target token address with ETH reserve address
            if (stepData.isV28OrHigherConverter)
                stepData.targetToken = ETH_RESERVE_ADDRESS;
            // older converter - replace the target token with the EtherToken address used by the converter
            else
                stepData.targetToken = getConverterEtherTokenAddress(stepData.converter);
        }

        // set the beneficiary for each step
        for (i = 0; i < data.length; i++) {
            stepData = data[i];

            // first check if the converter in this step is newer as older converters don't even support the beneficiary argument
            if (stepData.isV28OrHigherConverter) {
                // if affiliate fee is processed in this step, beneficiary is the network contract
                if (stepData.processAffiliateFee)
                    stepData.beneficiary = payable(address(this));
                // if it's the last step, beneficiary is the final beneficiary
                else if (i == data.length - 1)
                    stepData.beneficiary = _beneficiary;
                // if the converter in the next step is newer, beneficiary is the next converter
                else if (data[i + 1].isV28OrHigherConverter)
                    stepData.beneficiary = address(data[i + 1].converter);
                // the converter in the next step is older, beneficiary is the network contract
                else
                    stepData.beneficiary = payable(address(this));
            }
            else {
                // converter in this step is older, beneficiary is the network contract
                stepData.beneficiary = payable(address(this));
            }
        }

        return data;
    }

    /**
      * @dev utility, checks whether allowance for the given spender exists and approves one if it doesn't.
      * Note that we use the non standard erc-20 interface in which `approve` has no return value so that
      * this function will work for both standard and non standard tokens
      *
      * @param _token   token to check the allowance in
      * @param _spender approved address
      * @param _value   allowance amount
    */
    function ensureAllowance(IERC20Token _token, address _spender, uint256 _value) private {
        uint256 allowance = _token.allowance(address(this), _spender);
        if (allowance < _value) {
            if (allowance > 0)
                safeApprove(_token, _spender, 0);
            safeApprove(_token, _spender, _value);
        }
    }

    // legacy - returns the address of an EtherToken used by the converter
    function getConverterEtherTokenAddress(IConverter _converter) private view returns (IERC20Token) {
        uint256 reserveCount = _converter.connectorTokenCount();
        for (uint256 i = 0; i < reserveCount; i++) {
            IERC20Token reserveTokenAddress = _converter.connectorTokens(i);
            if (etherTokens[reserveTokenAddress])
                return reserveTokenAddress;
        }

        return ETH_RESERVE_ADDRESS;
    }

    // legacy - if the token is an ether token, returns the ETH reserve address
    // used by the converter, otherwise returns the input token address
    function getConverterTokenAddress(IConverter _converter, IERC20Token _token) private view returns (IERC20Token) {
        if (!etherTokens[_token])
            return _token;

        if (isV28OrHigherConverter(_converter))
            return ETH_RESERVE_ADDRESS;

        return getConverterEtherTokenAddress(_converter);
    }

    bytes4 private constant GET_RETURN_FUNC_SELECTOR = bytes4(keccak256("getReturn(address,address,uint256)"));

    // using a static call to get the return from older converters
    function getReturn(IConverter _dest, IERC20Token _sourceToken, IERC20Token _targetToken, uint256 _amount) internal view returns (uint256, uint256) {
        bytes memory data = abi.encodeWithSelector(GET_RETURN_FUNC_SELECTOR, _sourceToken, _targetToken, _amount);
        (bool success, bytes memory returnData) = address(_dest).staticcall(data);

        if (success) {
            if (returnData.length == 64) {
                return abi.decode(returnData, (uint256, uint256));
            }

            if (returnData.length == 32) {
                return (abi.decode(returnData, (uint256)), 0);
            }
        }

        return (0, 0);
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

    /**
      * @dev deprecated, backward compatibility
    */
    function getReturnByPath(address[] memory _path, uint256 _amount) public view returns (uint256, uint256) {
        return (rateByPath(_path, _amount), 0);
    }

    /**
      * @dev deprecated, backward compatibility
    */
    function convert(address[] memory _path, uint256 _amount, uint256 _minReturn) public payable returns (uint256) {
        return convertByPath(_path, _amount, _minReturn, address(0), address(0), 0);
    }

    /**
      * @dev deprecated, backward compatibility
    */
    function convert2(
        address[] memory _path,
        uint256 _amount,
        uint256 _minReturn,
        address _affiliateAccount,
        uint256 _affiliateFee
    )
        public
        payable
        returns (uint256)
    {
        return convertByPath(_path, _amount, _minReturn, address(0), _affiliateAccount, _affiliateFee);
    }

    /**
      * @dev deprecated, backward compatibility
    */
    function convertFor(address[] memory _path, uint256 _amount, uint256 _minReturn, address payable _beneficiary) public payable returns (uint256) {
        return convertByPath(_path, _amount, _minReturn, _beneficiary, address(0), 0);
    }

    /**
      * @dev deprecated, backward compatibility
    */
    function convertFor2(
        address[] memory _path,
        uint256 _amount,
        uint256 _minReturn,
        address payable _beneficiary,
        address _affiliateAccount,
        uint256 _affiliateFee
    )
        public
        payable
        greaterThanZero(_minReturn)
        returns (uint256)
    {
        return convertByPath(_path, _amount, _minReturn, _beneficiary, _affiliateAccount, _affiliateFee);
    }

    /**
      * @dev deprecated, backward compatibility
    */
    function claimAndConvert(address[] memory _path, uint256 _amount, uint256 _minReturn) public returns (uint256) {
        return convertByPath(_path, _amount, _minReturn, address(0), address(0), 0);
    }

    /**
      * @dev deprecated, backward compatibility
    */
    function claimAndConvert2(
        address[] memory _path,
        uint256 _amount,
        uint256 _minReturn,
        address _affiliateAccount,
        uint256 _affiliateFee
    )
        public
        returns (uint256)
    {
        return convertByPath(_path, _amount, _minReturn, address(0), _affiliateAccount, _affiliateFee);
    }

    /**
      * @dev deprecated, backward compatibility
    */
    function claimAndConvertFor(address[] memory _path, uint256 _amount, uint256 _minReturn, address payable _beneficiary) public returns (uint256) {
        return convertByPath(_path, _amount, _minReturn, _beneficiary, address(0), 0);
    }

    /**
      * @dev deprecated, backward compatibility
    */
    function claimAndConvertFor2(
        address[] memory _path,
        uint256 _amount,
        uint256 _minReturn,
        address payable _beneficiary,
        address _affiliateAccount,
        uint256 _affiliateFee
    )
        public
        returns (uint256)
    {
        return convertByPath(_path, _amount, _minReturn, _beneficiary, _affiliateAccount, _affiliateFee);
    }
}
