// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;

import "../oz/token/ERC721/IERC721MetadataUpgradeable.sol";
import "../oz/token/ERC721/IERC721EnumerableUpgradeable.sol";
import "../oz/token/ERC721/IERC721ReceiverUpgradeable.sol";
import "../oz/math/SafeMathUpgradeable.sol";
import "../oz/utils/AddressUpgradeable.sol";
import "../oz/utils/ContextUpgradeable.sol";
import "../oz/utils/EnumerableSetUpgradeable.sol";
import "../oz/utils/EnumerableMapUpgradeable.sol";
import "../oz/utils/StringsUpgradeable.sol";
import "../oz/proxy/Initializable.sol";
import "../oz/introspection/ERC165Upgradeable.sol";
import "../oz/access/OwnableUpgradeable.sol";
import {CustomStrings} from "../CustomStrings.sol";
import {IZNFTUpgradeable} from "./IZNFTUpgradeable.sol";

/**
 * @title ERC721 Non-Fungible Token Standard basic implementation
 * @dev see https://eips.ethereum.org/EIPS/eip-721
 */
contract ZNFTUpgradeable is
  Initializable,
  ContextUpgradeable,
  ERC165Upgradeable,
  OwnableUpgradeable,
  IZNFTUpgradeable,
  IERC721MetadataUpgradeable,
  IERC721EnumerableUpgradeable
{
  using SafeMathUpgradeable for uint256;
  using AddressUpgradeable for address;
  using EnumerableSetUpgradeable for EnumerableSetUpgradeable.UintSet;
  using EnumerableMapUpgradeable for EnumerableMapUpgradeable.UintToAddressMap;
  using StringsUpgradeable for uint256;

  // Equals to `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`
  // which can be also obtained as `IERC721Receiver(0).onERC721Received.selector`
  bytes4 private constant _ERC721_RECEIVED = 0x150b7a02;

  // Mapping from holder address to their (enumerable) set of owned tokens
  mapping(address => EnumerableSetUpgradeable.UintSet) private _holderTokens;

  // Enumerable mapping from token ids to their owners
  EnumerableMapUpgradeable.UintToAddressMap internal _tokenOwners;

  // Mapping from token ID to approved address
  mapping(uint256 => address) private _tokenApprovals;

  // Mapping from owner to operator approvals
  mapping(address => mapping(address => bool)) private _operatorApprovals;

  // Token name
  string private _name;

  // Token symbol
  string private _symbol;

  // Optional mapping for token URIs
  mapping(uint256 => string) private _tokenURIs;

  // Base URI
  string private _baseURI;

  /*
   *     bytes4(keccak256('balanceOf(address)')) == 0x70a08231
   *     bytes4(keccak256('ownerOf(uint256)')) == 0x6352211e
   *     bytes4(keccak256('approve(address,uint256)')) == 0x095ea7b3
   *     bytes4(keccak256('getApproved(uint256)')) == 0x081812fc
   *     bytes4(keccak256('setApprovalForAll(address,bool)')) == 0xa22cb465
   *     bytes4(keccak256('isApprovedForAll(address,address)')) == 0xe985e9c5
   *     bytes4(keccak256('transferFrom(address,address,uint256)')) == 0x23b872dd
   *     bytes4(keccak256('safeTransferFrom(address,address,uint256)')) == 0x42842e0e
   *     bytes4(keccak256('safeTransferFrom(address,address,uint256,bytes)')) == 0xb88d4fde
   *
   *     => 0x70a08231 ^ 0x6352211e ^ 0x095ea7b3 ^ 0x081812fc ^
   *        0xa22cb465 ^ 0xe985e9c5 ^ 0x23b872dd ^ 0x42842e0e ^ 0xb88d4fde == 0x80ac58cd
   */
  bytes4 private constant _INTERFACE_ID_ERC721 = 0x80ac58cd;

  /*
   *     bytes4(keccak256('name()')) == 0x06fdde03
   *     bytes4(keccak256('symbol()')) == 0x95d89b41
   *     bytes4(keccak256('tokenURI(uint256)')) == 0xc87b56dd
   *
   *     => 0x06fdde03 ^ 0x95d89b41 ^ 0xc87b56dd == 0x5b5e139f
   */
  bytes4 private constant _INTERFACE_ID_ERC721_METADATA = 0x5b5e139f;

  /*
   *     bytes4(keccak256('totalSupply()')) == 0x18160ddd
   *     bytes4(keccak256('tokenOfOwnerByIndex(address,uint256)')) == 0x2f745c59
   *     bytes4(keccak256('tokenByIndex(uint256)')) == 0x4f6ccce7
   *
   *     => 0x18160ddd ^ 0x2f745c59 ^ 0x4f6ccce7 == 0x780e9d63
   */
  bytes4 private constant _INTERFACE_ID_ERC721_ENUMERABLE = 0x780e9d63;

  // The address of the IPFS folder containing NFT metadata files as `ipfs://Qm...`
  string public ipfsFolder;

  // The address of the registrar that owns this contract
  address public zNSRegistrar;

  // The id of the domain that owns this collection
  uint256 public parentDomainId;

  /**
   * @notice Keep track of the total number of tokens minted by this collection
   * This allows unique hashing with the parentId below, rather than the `i` value
   * of the loop, which would cause collisions.
   */
  uint256 public quantityMinted;

  // tokenId => index
  // Keep track of the chronological number in which an nft as minted
  // So we can get that NFT as baseUri+index
  mapping(uint256 => uint256) public indexes;

  // Keep track of address allowed to manipulate tokens
  mapping(address => bool) controllers;

  /**
   * @dev Initializes the contract by setting a `name` and a `symbol` to the token collection.
   */
  function initialize(
    string memory name_,
    string memory symbol_,
    string memory ipfsFolder_,
    address zNSRegistrar_,
    uint256 parentDomainId_
  ) public initializer {
    __Context_init_unchained();
    __ERC165_init_unchained();
    __ERC721_init_unchained(name_, symbol_);
    __Ownable_init();

    ipfsFolder = ipfsFolder_;
    _setBaseURI(ipfsFolder);

    zNSRegistrar = zNSRegistrar_;
    parentDomainId = parentDomainId_;
    quantityMinted = 0;
  }

  function __ERC721_init_unchained(
    string memory name_,
    string memory symbol_
  ) internal initializer {
    _name = name_;
    _symbol = symbol_;

    // register the supported interfaces to conform to ERC721 via ERC165
    _registerInterface(_INTERFACE_ID_ERC721);
    _registerInterface(_INTERFACE_ID_ERC721_METADATA);
    _registerInterface(_INTERFACE_ID_ERC721_ENUMERABLE);
  }

  /// vvvvvvvvvvvvvvv ///
  /// Added Functions ///
  /// vvvvvvvvvvvvvvv ///

  /**
   * @dev Specify an account that is allowed to modify tokens
   * @param account The address of the account to allow
   */
  function addController(address account) public onlyOwner {
    require(account != address(0), "ZERC: Zero address");
    controllers[account] = true;
  }

  /**
   * @dev Check whether a given account is a controller
   * @param account The account to check
   */
  function isController(address account) external view returns (bool) {
    return controllers[account];
  }

  /**
   * @dev Limit a function to only be executable by a controller
   */
  function _onlyController() internal view {
    if (!controllers[msg.sender]) {
      revert OnlyController();
    }
  }

  function setParentDomainId(uint256 parentDomainId_) external onlyOwner {
    require(parentDomainId != parentDomainId_, "Same parentDomainId");
    parentDomainId = parentDomainId_;
  }

  /**
   * @dev Modify the registrar address
   * @param zNSRegistrar_ The new registrar address
   */
  function setZNSRegistrar(address zNSRegistrar_) external onlyOwner {
    require(zNSRegistrar != zNSRegistrar_, "Same registrar");
    zNSRegistrar = zNSRegistrar_;
  }

  /**
   * @dev Modify the collection name if needed
   * @param name_ The new collection name
   */
  function setName(string calldata name_) external onlyOwner {
    require(
      keccak256(abi.encodePacked(_name)) != keccak256(abi.encodePacked(name_)),
      "Same name"
    );
    _name = name_;
  }

  /**
   * @dev Modify the collection symbol if needed
   * @param symbol_ The new symbol for the collection
   */
  function setSymbol(string calldata symbol_) external onlyOwner {
    require(
      keccak256(abi.encodePacked(_symbol)) !=
        keccak256(abi.encodePacked(symbol_)),
      "Same symbol"
    );
    _symbol = symbol_;
  }

  function testFunc() public view returns (address) {
    return msg.sender;
  }

  /**
   * @dev Custom mint function
   */
  function mint(address to, uint256 amountToMint) public {
    // Require only controller can mint and transfer
    _onlyController();
    require(to != address(0), "ZERC: Mint to zero address");

    for (uint i = 0; i < amountToMint; ++i) {
      uint256 tokenId = uint256(
        keccak256(abi.encodePacked(parentDomainId, quantityMinted))
      );
      require(!_exists(tokenId), "ZERC: Token exists");
      _mint(msg.sender, tokenId);
      ++quantityMinted;
      indexes[tokenId] = quantityMinted;
      _transfer(msg.sender, to, tokenId);
    }
  }

  /// ^^^^^^^^^^^^^^^ ///
  /// Added Functions ///
  /// ^^^^^^^^^^^^^^^ ///

  /**
   * @dev See {IERC721-balanceOf}.
   */
  function balanceOf(
    address owner
  ) public view virtual override returns (uint256) {
    require(owner != address(0), "ERC721: balance query for the zero address");
    return _holderTokens[owner].length();
  }

  /**
   * @dev See {IERC721-ownerOf}.
   */
  function ownerOf(
    uint256 tokenId
  ) public view virtual override returns (address) {
    return
      _tokenOwners.get(tokenId, "ERC721: owner query for nonexistent token");
  }

  /**
   * @dev See {IERC721Metadata-name}.
   */
  function name() public view virtual override returns (string memory) {
    return _name;
  }

  /**
   * @dev See {IERC721Metadata-symbol}.
   */
  function symbol() public view virtual override returns (string memory) {
    return _symbol;
  }

  /**
   * @notice Modified for zNFT
   * @dev See {IERC721Metadata-tokenURI}.
   */
  function tokenURI(
    uint256 tokenId
  ) public view virtual override returns (string memory) {
    require(
      _exists(tokenId),
      "ERC721Metadata: URI query for nonexistent token"
    );

    string memory tokenIndex = CustomStrings.toString(indexes[tokenId]);

    string memory base = baseURI();

    // If there is no base URI, return the token URI.
    if (bytes(base).length == 0) {
      revert NoMetadataFolder();
    }

    return string(abi.encodePacked(base, tokenIndex));
  }

  /**
   * @dev Returns the base URI set via {_setBaseURI}. This will be
   * automatically added as a prefix in {tokenURI} to each token's URI, or
   * to the token ID if no specific URI is set for that token ID.
   */
  function baseURI() public view virtual returns (string memory) {
    return _baseURI;
  }

  /**
   * @dev See {IERC721Enumerable-tokenOfOwnerByIndex}.
   */
  function tokenOfOwnerByIndex(
    address owner,
    uint256 index
  ) public view virtual override returns (uint256) {
    return _holderTokens[owner].at(index);
  }

  /**
   * @dev See {IERC721Enumerable-totalSupply}.
   */
  function totalSupply() public view virtual override returns (uint256) {
    // _tokenOwners are indexed by tokenIds, so .length() returns the number of tokenIds
    return _tokenOwners.length();
  }

  /**
   * @dev See {IERC721Enumerable-tokenByIndex}.
   */
  function tokenByIndex(
    uint256 index
  ) public view virtual override returns (uint256) {
    (uint256 tokenId, ) = _tokenOwners.at(index);
    return tokenId;
  }

  /**
   * @dev See {IERC721-approve}.
   */
  function approve(address to, uint256 tokenId) public virtual override {
    address owner = ZNFTUpgradeable.ownerOf(tokenId);
    require(to != owner, "ERC721: approval to current owner");

    require(
      _msgSender() == owner ||
        ZNFTUpgradeable.isApprovedForAll(owner, _msgSender()),
      "ERC721: approve caller is not owner nor approved for all"
    );

    _approve(to, tokenId);
  }

  /**
   * @dev See {IERC721-getApproved}.
   */
  function getApproved(
    uint256 tokenId
  ) public view virtual override returns (address) {
    require(_exists(tokenId), "ERC721: approved query for nonexistent token");

    return _tokenApprovals[tokenId];
  }

  /**
   * @dev See {IERC721-setApprovalForAll}.
   */
  function setApprovalForAll(
    address operator,
    bool approved
  ) public virtual override {
    require(operator != _msgSender(), "ERC721: approve to caller");

    _operatorApprovals[_msgSender()][operator] = approved;
    emit ApprovalForAll(_msgSender(), operator, approved);
  }

  /**
   * @dev See {IERC721-isApprovedForAll}.
   */
  function isApprovedForAll(
    address owner,
    address operator
  ) public view virtual override returns (bool) {
    return _operatorApprovals[owner][operator];
  }

  /**
   * @dev See {IERC721-transferFrom}.
   */
  function transferFrom(
    address from,
    address to,
    uint256 tokenId
  ) public virtual override {
    //solhint-disable-next-line max-line-length
    require(
      _isApprovedOrOwner(_msgSender(), tokenId),
      "ERC721: transfer caller is not owner nor approved"
    );

    _transfer(from, to, tokenId);
  }

  /**
   * @dev See {IERC721-safeTransferFrom}.
   */
  function safeTransferFrom(
    address from,
    address to,
    uint256 tokenId
  ) public virtual override {
    safeTransferFrom(from, to, tokenId, "");
  }

  /**
   * @dev See {IERC721-safeTransferFrom}.
   */
  function safeTransferFrom(
    address from,
    address to,
    uint256 tokenId,
    bytes memory _data
  ) public virtual override {
    require(
      _isApprovedOrOwner(_msgSender(), tokenId),
      "ERC721: transfer caller is not owner nor approved"
    );
    _safeTransfer(from, to, tokenId, _data);
  }

  /**
   * @dev Safely transfers `tokenId` token from `from` to `to`, checking first that contract recipients
   * are aware of the ERC721 protocol to prevent tokens from being forever locked.
   *
   * `_data` is additional data, it has no specified format and it is sent in call to `to`.
   *
   * This internal function is equivalent to {safeTransferFrom}, and can be used to e.g.
   * implement alternative mechanisms to perform token transfer, such as signature-based.
   *
   * Requirements:
   *
   * - `from` cannot be the zero address.
   * - `to` cannot be the zero address.
   * - `tokenId` token must exist and be owned by `from`.
   * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.
   *
   * Emits a {Transfer} event.
   */
  function _safeTransfer(
    address from,
    address to,
    uint256 tokenId,
    bytes memory _data
  ) internal virtual {
    _transfer(from, to, tokenId);
    require(
      _checkOnERC721Received(from, to, tokenId, _data),
      "ERC721: transfer to non ERC721Receiver implementer"
    );
  }

  /**
   * @dev Returns whether `tokenId` exists.
   *
   * Tokens can be managed by their owner or approved accounts via {approve} or {setApprovalForAll}.
   *
   * Tokens start existing when they are minted (`_mint`),
   * and stop existing when they are burned (`_burn`).
   */
  function _exists(uint256 tokenId) internal view virtual returns (bool) {
    return _tokenOwners.contains(tokenId);
  }

  /**
   * @dev Returns whether `spender` is allowed to manage `tokenId`.
   *
   * Requirements:
   *
   * - `tokenId` must exist.
   */
  function _isApprovedOrOwner(
    address spender,
    uint256 tokenId
  ) internal view virtual returns (bool) {
    require(_exists(tokenId), "ERC721: operator query for nonexistent token");
    address owner = ZNFTUpgradeable.ownerOf(tokenId);
    return (spender == owner ||
      getApproved(tokenId) == spender ||
      ZNFTUpgradeable.isApprovedForAll(owner, spender));
  }

  /**
   * @dev Safely mints `tokenId` and transfers it to `to`.
   *
   * Requirements:
   *
   * - `tokenId` must not exist.
   * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.
   *
   * Emits a {Transfer} event.
   */
  function _safeMint(address to, uint256 tokenId) internal virtual {
    _safeMint(to, tokenId, "");
  }

  /**
   * @dev Same as {xref-ERC721-_safeMint-address-uint256-}[`_safeMint`], with an additional `data` parameter which is
   * forwarded in {IERC721Receiver-onERC721Received} to contract recipients.
   */
  function _safeMint(
    address to,
    uint256 tokenId,
    bytes memory _data
  ) internal virtual {
    _mint(to, tokenId);
    require(
      _checkOnERC721Received(address(0), to, tokenId, _data),
      "ERC721: transfer to non ERC721Receiver implementer"
    );
  }

  /**
   * @dev Mints `tokenId` and transfers it to `to`.
   *
   * WARNING: Usage of this method is discouraged, use {_safeMint} whenever possible
   *
   * Requirements:
   *
   * - `tokenId` must not exist.
   * - `to` cannot be the zero address.
   *
   * Emits a {Transfer} event.
   */
  function _mint(address to, uint256 tokenId) internal virtual {
    require(to != address(0), "ERC721: mint to the zero address");
    require(!_exists(tokenId), "ERC721: token already minted");

    _beforeTokenTransfer(address(0), to, tokenId);

    _holderTokens[to].add(tokenId);

    _tokenOwners.set(tokenId, to);

    emit Transfer(address(0), to, tokenId);
  }

  /**
   * @dev Destroys `tokenId`.
   * The approval is cleared when the token is burned.
   *
   * Requirements:
   *
   * - `tokenId` must exist.
   *
   * Emits a {Transfer} event.
   */
  function _burn(uint256 tokenId) internal virtual {
    address owner = ZNFTUpgradeable.ownerOf(tokenId); // internal owner

    _beforeTokenTransfer(owner, address(0), tokenId);

    // Clear approvals
    _approve(address(0), tokenId);

    // Clear metadata (if any)
    if (bytes(_tokenURIs[tokenId]).length != 0) {
      delete _tokenURIs[tokenId];
    }

    _holderTokens[owner].remove(tokenId);

    _tokenOwners.remove(tokenId);

    emit Transfer(owner, address(0), tokenId);
  }

  /**
   * @dev Transfers `tokenId` from `from` to `to`.
   *  As opposed to {transferFrom}, this imposes no restrictions on msg.sender.
   *
   * Requirements:
   *
   * - `to` cannot be the zero address.
   * - `tokenId` token must be owned by `from`.
   *
   * Emits a {Transfer} event.
   */
  function _transfer(
    address from,
    address to,
    uint256 tokenId
  ) internal virtual {
    require(
      ZNFTUpgradeable.ownerOf(tokenId) == from,
      "ERC721: transfer of token that is not own"
    ); // internal owner
    require(to != address(0), "ERC721: transfer to the zero address");

    _beforeTokenTransfer(from, to, tokenId);

    // Clear approvals from the previous owner
    _approve(address(0), tokenId);

    _holderTokens[from].remove(tokenId);
    _holderTokens[to].add(tokenId);

    _tokenOwners.set(tokenId, to);

    emit Transfer(from, to, tokenId);
  }

  /**
   * @dev Sets `_tokenURI` as the tokenURI of `tokenId`.
   *
   * Requirements:
   *
   * - `tokenId` must exist.
   */
  function _setTokenURI(
    uint256 tokenId,
    string memory _tokenURI
  ) internal virtual {
    _tokenURIs[tokenId] = _tokenURI;
  }

  /**
   * @dev Internal function to set the base URI for all token IDs. It is
   * automatically added as a prefix to the value returned in {tokenURI},
   * or to the token ID if {tokenURI} is empty.
   */
  function _setBaseURI(string memory baseURI_) internal virtual {
    _baseURI = baseURI_;
  }

  /**
   * @dev Internal function to invoke {IERC721Receiver-onERC721Received} on a target address.
   * The call is not executed if the target address is not a contract.
   *
   * @param from address representing the previous owner of the given token ID
   * @param to target address that will receive the tokens
   * @param tokenId uint256 ID of the token to be transferred
   * @param _data bytes optional data to send along with the call
   * @return bool whether the call correctly returned the expected magic value
   */
  function _checkOnERC721Received(
    address from,
    address to,
    uint256 tokenId,
    bytes memory _data
  ) private returns (bool) {
    if (!to.isContract()) {
      return true;
    }
    bytes memory returndata = to.functionCall(
      abi.encodeWithSelector(
        IERC721ReceiverUpgradeable(to).onERC721Received.selector,
        _msgSender(),
        from,
        tokenId,
        _data
      ),
      "ERC721: transfer to non ERC721Receiver implementer"
    );
    bytes4 retval = abi.decode(returndata, (bytes4));
    return (retval == _ERC721_RECEIVED);
  }

  /**
   * @dev Approve `to` to operate on `tokenId`
   *
   * Emits an {Approval} event.
   */
  function _approve(address to, uint256 tokenId) internal virtual {
    _tokenApprovals[tokenId] = to;
    emit Approval(ZNFTUpgradeable.ownerOf(tokenId), to, tokenId); // internal owner
  }

  /**
   * @dev Hook that is called before any token transfer. This includes minting
   * and burning.
   *
   * Calling conditions:
   *
   * - When `from` and `to` are both non-zero, ``from``'s `tokenId` will be
   * transferred to `to`.
   * - When `from` is zero, `tokenId` will be minted for `to`.
   * - When `to` is zero, ``from``'s `tokenId` will be burned.
   * - `from` cannot be the zero address.
   * - `to` cannot be the zero address.
   *
   * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
   */
  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal virtual {}

  uint256[41] private __gap;
}
