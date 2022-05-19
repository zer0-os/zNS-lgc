// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

interface IDomainPurchaser {
  struct PricingData {
    // price of domains with a 'short' name
    uint256 short;
    // price of domains with a 'medium' name
    uint256 medium;
    // price of domains with a 'long' namee
    uint256 long;
  }

  event NetworkPurchased(uint256 networkDomainId, address owner);
  event SubdomainPricingSet(uint256 domainId, PricingData pricing);
  event SubdomainMintingSet(uint256 domainId, bool enabled);
  event AllowSubdomainsToMintSet(uint256 domainId, bool enabled);

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
  ) external returns (uint256);

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
  ) external;

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
  ) external;
}
