// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.6.12;
import "./ERC20Token.sol";
import "./interfaces/IEtherToken.sol";
import "../utility/SafeMath.sol";

/**
  * @dev Ether tokenization contract
  *
  * 'Owned' is specified here for readability reasons
*/
contract EtherToken is IEtherToken, ERC20Token {
    using SafeMath for uint256;

    /**
      * @dev triggered when the total supply is increased
      *
      * @param _amount  amount that gets added to the supply
    */
    event Issuance(uint256 _amount);

    /**
      * @dev triggered when the total supply is decreased
      *
      * @param _amount  amount that gets removed from the supply
    */
    event Destruction(uint256 _amount);

    /**
      * @dev initializes a new EtherToken instance
      *
      * @param _name        token name
      * @param _symbol      token symbol
    */
    constructor(string memory _name, string memory _symbol)
        public
        ERC20Token(_name, _symbol, 18, 0) {
    }

    /**
      * @dev deposit ether on behalf of the sender
    */
    function deposit() public override payable {
        depositTo(msg.sender);
    }

    /**
      * @dev withdraw ether to the sender's account
      *
      * @param _amount  amount of ether to withdraw
    */
    function withdraw(uint256 _amount) public override {
        withdrawTo(msg.sender, _amount);
    }

    /**
      * @dev deposit ether to be entitled for a given account
      *
      * @param _to      account to be entitled for the ether
    */
    function depositTo(address _to)
        public
        override
        payable
        notThis(_to)
    {
        balanceOf[_to] = balanceOf[_to].add(msg.value); // add the value to the account balance
        totalSupply = totalSupply.add(msg.value); // increase the total supply

        emit Issuance(msg.value);
        emit Transfer(address(this), _to, msg.value);
    }

    /**
      * @dev withdraw ether entitled by the sender to a given account
      *
      * @param _to      account to receive the ether
      * @param _amount  amount of ether to withdraw
    */
    function withdrawTo(address payable _to, uint256 _amount)
        public
        override
        notThis(_to)
    {
        balanceOf[msg.sender] = balanceOf[msg.sender].sub(_amount); // deduct the amount from the account balance
        totalSupply = totalSupply.sub(_amount); // decrease the total supply
        _to.transfer(_amount); // send the amount to the target account

        emit Transfer(msg.sender, address(this), _amount);
        emit Destruction(_amount);
    }

    // ERC20 standard method overrides with some extra protection

    /**
      * @dev send coins
      * throws on any error rather then return a false flag to minimize user errors
      *
      * @param _to      target address
      * @param _value   transfer amount
      *
      * @return true if the transfer was successful, false if it wasn't
    */
    function transfer(address _to, uint256 _value)
        public
        override(IERC20Token, ERC20Token)
        notThis(_to)
        returns (bool)
    {
        return super.transfer(_to, _value);
    }

    /**
      * @dev an account/contract attempts to get the coins
      * throws on any error rather then return a false flag to minimize user errors
      *
      * @param _from    source address
      * @param _to      target address
      * @param _value   transfer amount
      *
      * @return true if the transfer was successful, false if it wasn't
    */
    function transferFrom(address _from, address _to, uint256 _value)
        public
        override(IERC20Token, ERC20Token)
        notThis(_to)
        returns (bool)
    {
        return super.transferFrom(_from, _to, _value);
    }

    /**
      * @dev deposit ether in the account
    */
    receive() external payable {
        deposit();
    }
}
