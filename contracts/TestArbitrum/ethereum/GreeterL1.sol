// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "../shared-dependencies/Inbox.sol";
import "../shared-dependencies/Outbox.sol";
import "../Greeter.sol";

contract GreeterL1 is Greeter {
  address public l2Target;
  IInbox public inbox;

  event RetryableTicketCreated(uint256 indexed ticketId);

  function __GreeterL1_init(
    string calldata _greeting,
    address _l2Target,
    address _inbox
  ) public initializer {
    __Greeter_init(_greeting);
    l2Target = _l2Target;
    inbox = IInbox(_inbox);
  }

  function setL2Target(address _l2Target) public onlyOwner {
    l2Target = _l2Target;
  }
}
