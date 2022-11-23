// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../oz/proxy/Initializable.sol";
import "../oz/token/ERC20/ERC20Upgradeable.sol";

contract MockToken is Initializable, ERC20Upgradeable {
  function initialize(string calldata name, string calldata symbol)
    public
    initializer
  {
    __ERC20_init(name, symbol);
  }

  function mint() public {
    _mint(msg.sender, 10000 * 10**18);
  }

  function mintAmountFor(uint256 amount, address forAccount) public {
    _mint(forAccount, amount);
  }
}
