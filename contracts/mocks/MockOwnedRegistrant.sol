// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {IOperatorFilterRegistry} from "../opensea/IOperatorFilterRegistry.sol";
import {Ownable} from "../oz/access/Ownable.sol";

/**
 * @dev Contract module which provides access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract. This
 * can later be changed with {transferOwnership} and {acceptOwnership}.
 *
 * This module is used through inheritance. It will make available all functions
 * from parent (Ownable).
 */
abstract contract Ownable2Step is Ownable {
  address private _pendingOwner;

  event OwnershipTransferStarted(
    address indexed previousOwner,
    address indexed newOwner
  );

  /**
   * @dev Returns the address of the pending owner.
   */
  function pendingOwner() public view virtual returns (address) {
    return _pendingOwner;
  }

  /**
   * @dev Starts the ownership transfer of the contract to a new account. Replaces the pending transfer if there is one.
   * Can only be called by the current owner.
   */
  function transferOwnership(
    address newOwner
  ) public virtual override onlyOwner {
    _pendingOwner = newOwner;
    emit OwnershipTransferStarted(owner(), newOwner);
  }

  /**
   * @dev Transfers ownership of the contract to a new account (`newOwner`) and deletes any pending owner.
   * Internal function without access restriction.
   */
  function _transferOwnership(address newOwner) internal virtual override {
    delete _pendingOwner;
    super._transferOwnership(newOwner);
  }

  /**
   * @dev The new owner accepts the ownership transfer.
   */
  function acceptOwnership() external {
    address sender = _msgSender();
    require(
      pendingOwner() == sender,
      "Ownable2Step: caller is not the new owner"
    );
    _transferOwnership(sender);
  }
}

/**
 * @title  OwnedRegistrant
 * @notice Ownable contract that registers itself with the OperatorFilterRegistry and administers its own entries,
 *         to facilitate a subscription whose ownership can be transferred.
 */
contract MockOwnedRegistrant is Ownable2Step {
  address constant registry = 0x000000000000AAeB6D7670E522A718067333cd4E;

  constructor(address _owner) {
    IOperatorFilterRegistry(registry).register(address(this));
    transferOwnership(_owner);
  }
}
