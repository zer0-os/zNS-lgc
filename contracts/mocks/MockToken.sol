// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

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
