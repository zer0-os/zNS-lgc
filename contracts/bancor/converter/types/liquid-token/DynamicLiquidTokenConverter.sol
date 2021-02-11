// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.6.12;
import "../../../converter/types/liquid-token/LiquidTokenConverter.sol";

/**
  * @dev Liquid Token Converter
  *
  * The dynamic liquid token converter is a specialized version of a converter that manages a liquid token
  * and allows for a reduction in reserve weight within a predefined set of boundaries.
  *
  * The converters govern a token with a single reserve and allow converting between the two.
  * Liquid tokens usually have fractional reserve (reserve ratio smaller than 100%).
  * The weight can be reduced by the defined stepWeight any time the defined marketCapThreshold
  * has been reached.
*/
contract DynamicLiquidTokenConverter is LiquidTokenConverter {
    uint32 public minimumWeight = 30000;
    uint32 public stepWeight = 10000;
    uint256 public marketCapThreshold = 10000 ether;
    uint256 lastWeightAdjustmentMarketCap = 0;

    event ReserveTokenWeightUpdate(uint32 _prevWeight, uint32 _newWeight, uint256 _percentage, uint256 _balance);

    /**
      * @dev initializes a new DyamicLiquidTokenConverter instance
      *
      * @param  _token              liquid token governed by the converter
      * @param  _registry           address of a contract registry contract
      * @param  _maxConversionFee   maximum conversion fee, represented in ppm
    */
    constructor(
        IDSToken _token,
        IContractRegistry _registry,
        uint32 _maxConversionFee
    )
        LiquidTokenConverter(_token, _registry, _maxConversionFee)
        public
    {
    }

    /**
      * @dev updates the market cap threshold
      * can only be called by the owner while inactive
      * 
      * @param _marketCapThreshold new threshold
    */
    function setMarketCapThreshold(uint256 _marketCapThreshold)
        public
        ownerOnly
        inactive
    {
        marketCapThreshold = _marketCapThreshold;
    }

    /**
      * @dev updates the current minimum weight
      * can only be called by the owner while inactive
      * 
      * @param _minimumWeight new minimum weight, represented in ppm
    */
    function setMinimumWeight(uint32 _minimumWeight)
        public
        ownerOnly
        inactive
    {
        minimumWeight = _minimumWeight;
    }

    /**
      * @dev updates the current step weight
      * can only be called by the owner while inactive
      * 
      * @param _stepWeight new step weight, represented in ppm
    */
    function setStepWeight(uint32 _stepWeight)
        public
        ownerOnly
        inactive
    {
        stepWeight = _stepWeight;
    }

    /**
      * @dev updates the token reserve weight
      * can only be called by the owner
      * 
      * @param _reserveToken    address of the reserve token
    */
    function reduceWeight(IERC20Token _reserveToken)
        public
        validReserve(_reserveToken)
        ownerOnly
    {
        uint256 currentMarketCap = getMarketCap(_reserveToken);
        require(currentMarketCap > (lastWeightAdjustmentMarketCap.add(marketCapThreshold)), "ERR_MARKET_CAP_BELOW_THRESHOLD");

        Reserve storage reserve = reserves[_reserveToken];
        uint256 newWeight = uint256(reserve.weight).sub(stepWeight);
        uint32 oldWeight = reserve.weight;
        require(newWeight >= minimumWeight, "ERR_INVALID_RESERVE_WEIGHT");

        uint256 percentage = uint256(PPM_RESOLUTION).sub(newWeight.mul(1e6).div(reserve.weight));

        uint32 weight = uint32(newWeight);
        reserve.weight = weight;
        reserveRatio = weight;

        uint256 balance = reserveBalance(_reserveToken).mul(percentage).div(1e6);

        if (_reserveToken == ETH_RESERVE_ADDRESS)
          msg.sender.transfer(balance);
        else
          safeTransfer(_reserveToken, msg.sender, balance);

        lastWeightAdjustmentMarketCap = currentMarketCap;

        syncReserveBalance(_reserveToken);

        emit ReserveTokenWeightUpdate(oldWeight, weight, percentage, reserve.balance);
    }

    function getMarketCap(IERC20Token _reserveToken)
        public
        view
        returns(uint256)
    {
        Reserve storage reserve = reserves[_reserveToken];
        return reserveBalance(_reserveToken).mul(1e6).div(reserve.weight);
    }

    /**
      * Upgrade functions. Overriden to allow upgrades by owner.
    **/

    /**
      * @dev withdraws ether
      * can only be called by the owner
      * can only be called if the converter has an ETH reserve
      *
      * @param _to  address to send the ETH to
    */
    function withdrawETH(address payable _to)
        public
        override
        protected
        ownerOnly
        validReserve(ETH_RESERVE_ADDRESS)
    {
        _to.transfer(address(this).balance);

        // sync the ETH reserve balance
        syncReserveBalance(ETH_RESERVE_ADDRESS);
    }

    /**
      * @dev transfers the anchor ownership
      * the new owner needs to accept the transfer
      *
      * @param _newOwner    new token owner
    */
    function transferAnchorOwnership(address _newOwner)
        public
        override
        ownerOnly
    {
        anchor.transferOwnership(_newOwner);
    }

    /**
      * @dev withdraws tokens held by the converter and sends them to an account
      * can only be called by the owner
      *
      * @param _token   ERC20 token contract address
      * @param _to      account to receive the new amount
      * @param _amount  amount to withdraw
    */
    function withdrawTokens(IERC20Token _token, address _to, uint256 _amount)
        public
        override
        protected
        ownerOnly
    {
        TokenHolder.withdrawTokens(_token, _to, _amount);

        // if the token is a reserve token, sync the reserve balance
        if (reserves[_token].isSet)
            syncReserveBalance(_token);
    }

}
