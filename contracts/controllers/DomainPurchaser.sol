// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import {OwnableUpgradeable, Initializable} from "../oz/access/OwnableUpgradeable.sol";
import {IRegistrar} from "../interfaces/IRegistrar.sol";
import {IZNSHub} from "../interfaces/IZNSHub.sol";
import {IERC20Upgradeable} from "../oz/token/ERC20/IERC20Upgradeable.sol";
import {SafeERC20Upgradeable} from "../oz/token/ERC20/SafeERC20Upgradeable.sol";

contract DomainPurchaser is Initializable, OwnableUpgradeable {
  using SafeERC20Upgradeable for IERC20Upgradeable;

  struct PricingData {
    uint256 long;
    uint256 medium;
    uint256 short;
  }

  event NetworkPurchased(uint256 networkDomainId, address owner);

  IERC20Upgradeable public paymentToken;
  IZNSHub public zNSHub;
  address public proceedsWallet;
  PricingData public prices;

  function initialize(
    address _paymentToken,
    address _zNSHub,
    address _proceedsWallet,
    PricingData memory _prices
  ) public initializer {
    __Ownable_init();
    paymentToken = IERC20Upgradeable(_paymentToken);
    zNSHub = IZNSHub(_zNSHub);
    proceedsWallet = _proceedsWallet;
    prices = _prices;
  }

  function purchaseNetwork(string memory name, string memory metadataUri)
    external
  {
    // Purchased networks will always be on the root (0://) domain
    uint256 rootDomainId = 0;

    uint256 lengthOfName = strlen(name);
    require(lengthOfName > 0, "DP: Empty string");
    require(lengthOfName < 33, "DP: Name too long");

    // Calculate out the cost of the network domain
    uint256 price = prices.long; // Default price
    if (lengthOfName < 4) {
      price = prices.short;
    } else if (lengthOfName < 8) {
      price = prices.medium;
    }

    // Take ZERO tokens (ERC20) from the user
    paymentToken.safeTransferFrom(msg.sender, proceedsWallet, price);

    // Create the network domain
    IRegistrar rootRegistrar = zNSHub.getRegistrarForDomain(rootDomainId);
    uint256 createdDomainId = rootRegistrar.registerSubdomainContract(
      rootDomainId,
      name,
      msg.sender, // Minter
      metadataUri,
      0, // Royalty Amount
      false, // is Metadata Locked
      msg.sender // Who to send the domain
    );

    emit NetworkPurchased(createdDomainId, msg.sender);
  }

  /**
   * Calculates out the length of a string
   */
  function strlen(string memory s) internal pure returns (uint256) {
    uint256 len = 0;
    uint256 bytelength = bytes(s).length;
    for (uint256 i = 0; i < bytelength; len++) {
      bytes1 b = bytes(s)[i];
      if (b < 0x80) {
        i += 1;
      } else if (b < 0xE0) {
        i += 2;
      } else if (b < 0xF0) {
        i += 3;
      } else if (b < 0xF8) {
        i += 4;
      } else if (b < 0xFC) {
        i += 5;
      } else {
        i += 6;
      }
    }
    return len;
  }
}
