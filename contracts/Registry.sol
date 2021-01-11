// pragma solidity ^0.7.6;
// pragma experimental ABIEncoderV2;
// // ABIEncoderV2 only used for view functions

// /**
//  * @title Registry
//  * @dev Create and interact with Registries.
//  */

// import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721MetadataUpgradeable.sol";
// import "./strings.sol";
// import "./IPFSHash.sol";

// // import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
// // import "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol";
// import "./strings.sol";
// // import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/utils/EnumerableSetUpgradeable.sol";

// contract Registry is ERC721Upgradeable {
//     using EnumerableSetUpgradeable for EnumerableSetUpgradeable.UintSet;
//     struct Entry {
//         uint256 parent;
//         uint256 depth;
//         string domain;
//         string ref;
//         address predicates;
//         address registrar;
//         EnumerableSetUpgradeable.UintSet children;
//     }

//     struct EntryView {
//         uint parent;
//         string ref;
//         string domain;
//         address registrar;
//         address owner;
//         uint256[] children;
//     }

//     mapping(uint256 => Entry) internal _entries;

//     event DomainCreated(
//         uint256 indexed parentId,
//         uint256 tokenId,
//         string domain,
//         address _owner,
//         address _registrar,
//         string _ref
//     );

//     constructor(address _owner, address _registrar) public {
//         __ERC721_init("Zer0 Name Service", "ZNS");
//         _mint(_owner, 0);
//         Entry storage entry = _entries[0];
//         entry.ref = "ZNS";
//         entry.registrar = _registrar;
//         DomainCreated(0, 0, "_root", _owner, _registrar, "zer0.io");
//     }

//     function getRegistrar(uint id) external view returns (address) {
//         return _entries[id].registrar;
//     }

//     function getChildLength(uint id) external view returns (uint) {
//         return _entries[id].children.length();
//     }

//     function getDepth(uint id) external view returns (uint) {
//         return _entries[id].children.depth;
//     }


//     function _onlyDomainOwner(uint256 id) internal {
//         require(ownerOf(id) == msg.sender);
//     }
    
//     modifier onlyDomainOwner(uint256 id) {
//         require(ownerOf(id) == msg.sender);
//         _;
//     }

//     function _onlyDomainRegistrar(uint256 id) internal {
//         require(_entries[id].registrar == msg.sender);
//     }
    
//     modifier onlyDomainRegistrar(uint256 id) {
//         require(_entries[id].registrar == msg.sender);
//         _;
//     }

//     function _onlyCanCreate(uint256 id, address _registrar, address _owner) {
//         address registrar = entries[id].registrar;
//         if(registrar != address(0)) {
//             require(IRegistrar(registrar).canCreate(_owner, _registrar));
//         }
//     }
    
//     modifier onlyCanCreate(uint256 id, address _registrar, address _owner) {
//         address registrar = entries[id].registrar;
//         if(registrar != address(0)) {
//             require(IRegistrar(registrar).canCreate(_owner, _registrar));
//         }
//         _;
//     }
    
//     //  paginate children
//     function entries(uint256 id) external view returns (EntryView memory out) {
//         Entry storage entry = _entries[id];
//         out.owner = ownerOf(id);
//         out.parent = entry.parent;
//         out.registrar = entry.registrar;
//         out.ref = entry.ref;
//         out.domain = entry.domain;
//         out.children = new uint256[](entry.children.length());
//         for(uint i = 0; i < out.children.length; i++) {
//             out.children[i] = entry.children.at(i);
//         }
//     }

//     function _transfer(
//         address from,
//         address to,
//         uint256 tokenId
//     ) internal override {
//         if (_entries[tokenId].registrar == ownerOf(tokenId)) {
//             _entries[tokenId].registrar = to;
//         }
//         ERC721Upgradeable._transfer(from, to, tokenId);
//     }

//     function tokenURI(uint256 token) public view override returns (string memory out) {
//         out = string(abi.encodePacked("ipfs://",verifyIPFS.generateHash(string(abi.encodePacked('{"name":"', _entries[token].domain,'"}')))));
//         // return _entries[token].domain;
//     }

//     function _createDomain(
//         // uint256 parentId,
//         string calldata domain,
//         address _owner,
//         address _registrar,
//         string calldata _ref
//     ) internal {
//         // require(bytes(domain).length > 0); // is this necessary if gov controls tld?
//         (bool succ, uint256 parentId, string memory child) = strings.validateDomain(domain);
//         require(succ);
//         _onlyDomainRegistrar(parentId);
//         uint256 id = uint256(keccak256(abi.encode(parentId, child)));
//         _onlyCanCreate(id, _owner, _registrar);
//         _mint(_owner, id); //  _mint makes sure doesn't exist
//         require(_entries[parentId].children.add(id)); // extra check
//         Entry storage entry = _entries[id];
//         entry.depth = parent.depth + 1;
//         entry.parent = parentId;
//         entry.ref = _ref;
//         entry.domain = domain;
//         entry.registrar = _registrar;
//         DomainCreated(parentId, id, domain, _owner, _registrar, _ref);
//     }

//     function createDomain(
//         // uint256 parentId,
//         string calldata domain,
//         address _owner,
//         address _registrar,
//         string calldata _ref
//     ) public {
//         _createDomain(domain, _owner, _registrar, _ref);
//     }

//     function getId(string[] memory path) public pure returns (uint256) {
//         bytes32 _hash = "";
//         for (uint256 i = 0; i < path.length; i++) {
//             _hash = keccak256(abi.encode(_hash, path[i]));
//         }
//         return uint256(_hash);
//     }

//     function getOwner(string[] memory path) external view returns (address) {
//         return ownerOf(getId(path));
//     }

//     function validateDomain(string memory _s)
//         public
//         pure
//         returns (
//             bool valid,
//             uint256 parent,
//             string memory domain
//         )
//     {
//         (valid, parent, domain) = strings.validateDomain(_s);
//     }
// }
