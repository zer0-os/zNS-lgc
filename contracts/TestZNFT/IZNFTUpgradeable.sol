// SPDX-License-Identifier: MIT

pragma solidity 0.8.11;

import {IERC721Upgradeable} from "../oz/token/ERC721/IERC721Upgradeable.sol";

interface IZNFTUpgradeable is IERC721Upgradeable {
  error OnlyController();
  error NoMetadataFolder();

  /**
   * @dev Specify an account that is allowed to modify tokens
   * @param account The address of the account to allow
   */
  function addController(address account) external;

  /**
   * @dev Check whether a given account is a controller
   * @param account The account to check
   */
  function isController(address account) external view returns (bool);

  /**
   * @dev Modify the parentDomainId
   * @param parentDomainId_ The new parentDomainId
   */
  function setParentDomainId(uint256 parentDomainId_) external;

  /**
   * @dev Modify the registrar address
   * @param zNSRegistrar_ The new registrar address
   */
  function setZNSRegistrar(address zNSRegistrar_) external;

  /**
   * @dev Modify the collection name if needed
   * @param name_ The new collection name
   */
  function setName(string calldata name_) external;

  /**
   * @dev Modify the collection symbol if needed
   * @param symbol_ The new symbol for the collection
   */
  function setSymbol(string calldata symbol_) external;

  /**
   * @dev Call to mint new tokens for `to` given `amountToMint`
   * @param to The account to transfer the minted tokens to
   * @param amountToMint The quantity of tokens to mint
   */
  function mint(address to, uint256 amountToMint) external;

  function testFunc() external view returns (address);
}
