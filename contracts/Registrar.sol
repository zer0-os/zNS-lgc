pragma solidity ^0.7.6;
pragma experimental ABIEncoderV2;
// ABIEncoderV2 only used for view functions

/**
 * @title Registrar
 * @dev Create and interact with Registries.
 */

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721MetadataUpgradeable.sol";
import "./strings.sol";
import "./IPFSHash.sol";

// import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
// import "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol";
import "./strings.sol";
// import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/EnumerableSetUpgradeable.sol";

contract Registrar is ERC721Upgradeable {
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.UintSet;
    struct Entry {
        uint256 parent;
        string domain;
        string ref;
        address controller;
        EnumerableSetUpgradeable.UintSet children;
    }

    struct EntryView {
        uint parent;
        string ref;
        string domain;
        address controller;
        address owner;
        uint256[] children;
    }

    mapping(uint256 => Entry) internal _entries;

    event DomainCreated(
        uint256 indexed parentId,
        uint256 tokenId,
        string domain,
        address _owner,
        address _controller,
        string _ref
    );

    constructor(address _owner, address _controller) public {
        __ERC721_init("Zer0 Name Service", "ZNS");
        _mint(_owner, 0);
        Entry storage entry = _entries[0];
        entry.ref = "ZNS";
        entry.controller = _controller;
        DomainCreated(0, 0, "_root", _owner, _controller, "zer0.io");
    }

    function _onlyDomainOwner(uint256 id) internal {
        require(ownerOf(id) == msg.sender);
    }
    
    modifier onlyDomainOwner(uint256 id) {
        require(ownerOf(id) == msg.sender);
        _;
    }
    //  paginate children
    function entries(uint256 id) external view returns (EntryView memory out) {
        Entry storage entry = _entries[id];
        out.owner = ownerOf(id);
        out.parent = entry.parent;
        out.controller = entry.controller;
        out.ref = entry.ref;
        out.domain = entry.domain;
        out.children = new uint256[](entry.children.length());
        for(uint i = 0; i < out.children.length; i++) {
            out.children[i] = entry.children.at(i);
        }
    }

    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override {
        if (_entries[tokenId].controller == ownerOf(tokenId)) {
            _entries[tokenId].controller = to;
        }
        ERC721Upgradeable._transfer(from, to, tokenId);
    }

    function tokenURI(uint256 token) public view override returns (string memory out) {
        out = string(abi.encodePacked("ipfs://",verifyIPFS.generateHash(string(abi.encodePacked('{"name":"', _entries[token].domain,'"}')))));
        // return _entries[token].domain;
    }

    function _createDomain(
        // uint256 parentId,
        string calldata domain,
        address _owner,
        address _controller,
        string calldata _ref
    ) internal {
        // require(bytes(domain).length > 0); // is this necessary if gov controls tld?
        (bool succ, uint256 parentId, string memory child) = strings.validateDomain(domain);
        _onlyDomainOwner(parentId);
        uint256 id = uint256(keccak256(abi.encode(parentId, child)));
        _mint(_owner, id); //  _mint makes sure doesn't exist
        require(_entries[parentId].children.add(id)); // extra check
        Entry storage entry = _entries[id];
        entry.parent = parentId;
        entry.ref = _ref;
        entry.domain = domain;
        entry.controller = _controller;
        DomainCreated(parentId, id, domain, _owner, _controller, _ref);
    }

    function createDomain(
        // uint256 parentId,
        string calldata domain,
        address _owner,
        address _controller,
        string calldata _ref
    ) public {
        _createDomain(domain, _owner, _controller, _ref);
    }

    function getId(string[] memory path) public pure returns (uint256) {
        bytes32 _hash = "";
        for (uint256 i = 0; i < path.length; i++) {
            _hash = keccak256(abi.encode(_hash, path[i]));
        }
        return uint256(_hash);
    }

    function getOwner(string[] memory path) external view returns (address) {
        return ownerOf(getId(path));
    }

    function validateDomain(string memory _s)
        public
        pure
        returns (
            bool valid,
            uint256 parent,
            string memory domain
        )
    {
        (valid, parent, domain) = strings.validateDomain(_s);
    }
}
