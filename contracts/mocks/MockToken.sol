// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract MockToken is Initializable, ERC20Upgradeable {
  function initialize() public initializer {
    __ERC20_init("Mock Token", "MT");
  }

  function mint() public {
    _mint(msg.sender, 100000000000 * 10**18);
  }

  function mintFor(address account) public {
    _mint(account, 100000000000 * 10**18);
  }

  function mintAmountFor(address account, uint256 amount) public {
    _mint(account, amount);
  }
}
