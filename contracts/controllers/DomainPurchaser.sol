// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import {OwnableUpgradeable, Initializable} from "../oz/access/OwnableUpgradeable.sol";
import {IRegistrar} from "../interfaces/IRegistrar.sol";
import {IZNSHub} from "../interfaces/IZNSHub.sol";
import {IDomainPurchaser} from "../interfaces/IDomainPurchaser.sol";
import {IERC20Upgradeable} from "../oz/token/ERC20/IERC20Upgradeable.sol";
import {SafeERC20Upgradeable} from "../oz/token/ERC20/SafeERC20Upgradeable.sol";

contract DomainPurchaser is
  IDomainPurchaser,
  Initializable,
  OwnableUpgradeable
{
  using SafeERC20Upgradeable for IERC20Upgradeable;

  // Names that are < shortNameLength are considered 'short'
  uint256 constant shortNameLength = 4;
  // Names that are < mediumNameLength are 'medium'
  uint256 constant mediumNameLength = 8;
  // Names that are < maxNameLength are 'long'
  uint256 constant maxNameLength = 33;

  // Divison basis for 'platformFee' percentages
  uint256 constant divisionBasisPlatformFee = 1000;

  /**
   * Configuration / State of purchasing related information for a domain
   */
  struct DomainPurchaseData {
    /**
     * Whether or not subdomain minting is enabled on this domain.
     */
    bool subdomainMintingEnabled;
    /**
     * Pricing information for minting subdomains
     */
    PricingData prices;
    /**
     * Whether or not subdomains minted on this domain are allowed to mint subdomains
     * Example:
     *    if 'allowSubdomainsToMint' is false, I (the owner of 0://cats) could allow another user to mint
     *    '0://cats.meow' but then that user could not have others mint subdomains on that such as:
     *    '0://cats.meow.tuna'
     *    if 'allowSubdomainsToMint' is true, then '0://cats.meow.tuna' could be minted if the owner of
     *    '0://cats.meow' enables subdomain minting on ''0://cats.meow' (ie 'subdomainMintingEnabled')
     *
     * Note: If a subdomain is minted while 'allowSubdomainsToMint' is enabled, then it inherits that
     *    state and ignores the parent domains 'allowSubdomainsToMint' state.
     */
    bool allowSubdomainsToMint;
    /**
     * Copy of `.allowSubdomainsToMint` when this domain was minted.
     * This way if a user mints a subdomain on a domain which did allow subdomain minting
     * but then later that (parent) domain disables it
     * The user is still able to allow others to mint subdomains on that domain
     */
    bool wasAllowedToSubdomainMintOnCreation;
  }

  // The token used to mint subdomains
  IERC20Upgradeable public paymentToken;

  // Reference to the zNS Hub
  IZNSHub public zNSHub;

  // The wallet which fees owed to the platform go to
  address public platformWallet;

  // The percentage of proceeds that the platform gets encoded as (1000 = 100% | 1 = 0.1%)
  uint256 public platformFee;

  // Mapping of Domain Id => DomainPurchaseData
  mapping(uint256 => DomainPurchaseData) public purchaseData;

  // Allow for non-network domains to be minted
  bool allowMintingNonNetwork;

  function initialize(
    address _paymentToken,
    address _zNSHub,
    address _platformWallet,
    PricingData memory _rootPrices,
    uint256 _platformFee
  ) public initializer {
    __Ownable_init();
    paymentToken = IERC20Upgradeable(_paymentToken);
    zNSHub = IZNSHub(_zNSHub);
    platformWallet = _platformWallet;

    // Setup purchase information for the root (0://) domain
    purchaseData[0] = DomainPurchaseData({
      prices: _rootPrices,
      subdomainMintingEnabled: _rootPrices.short > 0, // Protection in case a price for short domains is forgotten
      allowSubdomainsToMint: true,
      wasAllowedToSubdomainMintOnCreation: true
    });

    platformFee = _platformFee;
    allowMintingNonNetwork = false;
  }

  /**
   * Mint (Purchase) a subdomain on another domain
   * @param parentId The parent domain of the subdomain we are creating
   * @param name The name of the subdomain we are minting
   * @param metadataUri The initial metadata of the domain we are minting
   * @return The minted domain's id
   */
  function purchaseSubdomain(
    uint256 parentId,
    string memory name,
    string memory metadataUri
  ) external returns (uint256) {
    DomainPurchaseData memory domainData = purchaseData[parentId];

    // When minting a non-network domain
    if (parentId != 0) {
      // May be disabled at a contract level
      if (!allowMintingNonNetwork) {
        revert("DP: Only purchasing network domains is allowed currently.");
      }

      /*
        When minting a subdomain on something other than the root (0) we need to check
        to see if the parent of the domain we're minting a subdomain on (grandParent)
        allows for subdomain minting on our domain.

        If the domain we're minting a subdomain on (parent) was created when the parent
        of that domain (grandParent) did allow subdomain minting, we use that state
        instead of the current state.
      */
      uint256 grandParentId = zNSHub.parentOf(parentId);
      require(
        domainData.wasAllowedToSubdomainMintOnCreation ||
          purchaseData[grandParentId].allowSubdomainsToMint,
        "DP: Subdomains disallowed at this level."
      );
    }

    require(domainData.subdomainMintingEnabled, "DP: Minting not enabled");

    uint256 price = getDomainPrice(parentId, name);

    if (price > 0) {
      if (parentId == 0) {
        // The platform is always considered to own the root domain (parentId == 0)
        paymentToken.safeTransferFrom(msg.sender, platformWallet, price);
      } else {
        uint256 fee = (price * platformFee) / divisionBasisPlatformFee;

        // Take ZERO tokens (ERC20) from the user
        paymentToken.safeTransferFrom(
          msg.sender,
          zNSHub.ownerOf(parentId),
          price - fee
        );

        // If there was a fee, send it to the platform
        if (fee > 0) {
          paymentToken.safeTransferFrom(msg.sender, platformWallet, fee);
        }
      }
    }

    // Create the domain
    IRegistrar rootRegistrar = zNSHub.getRegistrarForDomain(parentId);
    uint256 createdDomainId = rootRegistrar.registerSubdomainContract(
      parentId,
      name,
      msg.sender, // Minter
      metadataUri,
      0, // Royalty Amount
      false, // is Metadata Locked
      msg.sender // Who to send the domain
    );

    if (domainData.allowSubdomainsToMint) {
      /*
        Our parent domain (the one we're minting the subdomain on)
        currently allows for subdomains to be minted on the domain we just minted
        so we save that state since in case the parent domain no longer allows it in the future
      */
      purchaseData[createdDomainId]
        .wasAllowedToSubdomainMintOnCreation = domainData.allowSubdomainsToMint;
    }

    emit NetworkPurchased(createdDomainId, msg.sender);

    return createdDomainId;
  }

  /**
   * Sets the purchase price of a domain, and allows for enabling subdomain minting to be set
   * @param domainId The domain to set pricing data for
   * @param pricing The pricing data
   * @param subdomainMintingEnabled Whether subdomain minting should be enabled
   * @param allowSubdomainsToMint Whether to allow subdomains to mint their own subdomains via the purchaser
   */
  function setDomainPricing(
    uint256 domainId,
    PricingData memory pricing,
    bool subdomainMintingEnabled,
    bool allowSubdomainsToMint
  ) external {
    require(
      msg.sender == zNSHub.ownerOf(domainId) || msg.sender == owner(),
      "DP: Not authorized"
    );
    DomainPurchaseData storage record = purchaseData[domainId];

    bool differentPrices = record.prices.short != pricing.short ||
      record.prices.medium != pricing.medium ||
      record.prices.long != pricing.long;
    require(
      differentPrices,
      "DP: Pricing info is the same. Use .setDomainMintingStatus"
    );

    record.prices = pricing;
    emit SubdomainPricingSet(domainId, pricing);

    _setDomainMintingStatus(
      domainId,
      record,
      subdomainMintingEnabled,
      allowSubdomainsToMint
    );
  }

  /**
   * Sets the state of 'subdomainMintingEnabled' for a domain.
   * Thus either enabling/disabling of subdomain minting
   * @param domainId The domain to set
   * @param subdomainMintingEnabled Whether minting is enabled
   * @param allowSubdomainsToMint Whether subdomains minting their own subdomains is allowed
   */
  function setDomainMintingStatus(
    uint256 domainId,
    bool subdomainMintingEnabled,
    bool allowSubdomainsToMint
  ) external {
    require(
      msg.sender == zNSHub.ownerOf(domainId) || msg.sender == owner(),
      "DP: Not authorized"
    );

    DomainPurchaseData storage record = purchaseData[domainId];

    // Enforce that a state change must happen
    bool stateChanged = record.subdomainMintingEnabled !=
      subdomainMintingEnabled ||
      record.allowSubdomainsToMint != allowSubdomainsToMint;
    require(stateChanged, "DP: No state change");

    // Set statuses for minting
    _setDomainMintingStatus(
      domainId,
      record,
      subdomainMintingEnabled,
      allowSubdomainsToMint
    );
  }

  /**
   * Allows for the platform fee to be set by the owner.
   * @param fee The new fee
   */
  function setPlatformFee(uint256 fee) external onlyOwner {
    require(platformFee != fee, "DP: Same fee");
    require(fee < divisionBasisPlatformFee, "DP: Fee beyond 99.99%");

    platformFee = fee;
  }

  /**
   * Allows for the platform wallet to be set by the owner
   * @param wallet The new platform wallet
   */
  function setPlatformWallet(address wallet) external onlyOwner {
    require(wallet != platformWallet, "DP: Same Wallet");

    platformWallet = wallet;
  }

  /**
   * Set whether the minting of non-network domains is allowed
   * @param allowed Whether it is allowed or not
   */
  function setNonNetworkDomainMinting(bool allowed) external onlyOwner {
    require(allowed != allowMintingNonNetwork, "DP: No state change");
    allowMintingNonNetwork = allowed;
  }

  /* --------- Public View ------------------ */

  /**
   * Get the price to mint a subdomain on a parent based on the name
   * @param parentId The parent domain
   * @param name the name of the subdomain
   * @return The price of the domain
   */
  function getDomainPrice(uint256 parentId, string memory name)
    public
    view
    returns (uint256)
  {
    DomainPurchaseData memory domainData = purchaseData[parentId];

    uint256 lengthOfName = strlen(name);
    require(lengthOfName > 0, "DP: Empty string");
    require(lengthOfName < maxNameLength, "DP: Name too long");

    // Calculate out the cost of the network domain
    uint256 price = domainData.prices.long; // Default price
    if (lengthOfName < shortNameLength) {
      price = domainData.prices.short;
    } else if (lengthOfName < mediumNameLength) {
      price = domainData.prices.medium;
    }

    return price;
  }

  /* --------- Internal + Private ------------ */

  // Internal helper to set minting statuses
  function _setDomainMintingStatus(
    uint256 domainId,
    DomainPurchaseData storage record,
    bool subdomainMintingEnabled,
    bool allowSubdomainsToMint
  ) private {
    // Only modify/emit if subdomainMintingEnabled changes
    if (record.subdomainMintingEnabled != subdomainMintingEnabled) {
      record.subdomainMintingEnabled = subdomainMintingEnabled;
      emit SubdomainMintingSet(domainId, subdomainMintingEnabled);
    }

    // Only modify/emit if allowSubdomainsToMint changes
    if (record.allowSubdomainsToMint != allowSubdomainsToMint) {
      record.allowSubdomainsToMint = allowSubdomainsToMint;
      emit AllowSubdomainsToMintSet(domainId, allowSubdomainsToMint);
    }
  }

  /**
   * Calculates out the length of a Unicode string
   * Since Unicode can be different byte lengths ('👻' is more bytes than 'a')
   * We inspect the first byte of each unicode character
   * which allows us to determine how many bytes are in each unicode character
   */
  function strlen(string memory s) internal pure returns (uint256) {
    uint256 len = 0;
    uint256 bytelength = bytes(s).length;
    for (uint256 i = 0; i < bytelength; len++) {
      // Inspect the first byte to see how large the character is
      // and then skip an appropriate number of bytes
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
