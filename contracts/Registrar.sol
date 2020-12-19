pragma solidity ^0.7.6;
pragma experimental ABIEncoderV2;
// ABIEncoderV2 only used for view functions

/**
 * @title Registrar
 * @dev Create and interact with Registries.
 */

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "./strings.sol";
import "./IPFSHash.sol";

// import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
// import "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol";
import "./strings.sol";
// import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
// import "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol";

contract Registrar is ERC721Upgradeable {
    struct Entry {
        string ref;
        address controller;
    }

    struct EntryView {
        string ref;
        address controller;
        address owner;
    }

    mapping(uint256 => Entry) public entries;

    event RegistryCreated(
        uint256 parentId,
        string domain,
        address _owner,
        address _controller,
        string _ref
    );

    constructor(address _owner) public {
        // registryMap[""] = _owner;
        __ERC721_init("Zer0 Name Service", "ZNS");
        _mint(_owner, 0);
        Entry storage entry = entries[0];
        entry.ref = "ZNS";
        entry.controller = _owner;
    }

    modifier onlyDomainOwner(uint256 id) {
        require(ownerOf(id) == msg.sender);
        _;
    }

    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override {
        if (entries[tokenId].controller == ownerOf(tokenId)) {
            entries[tokenId].controller = to;
        }
        ERC721Upgradeable._transfer(from, to, tokenId);
    }

    function _createRegistry(
        uint256 parentId,
        string calldata domain,
        address _owner,
        address _controller,
        string calldata _ref
    ) internal {
        //  _mint makes sure doesn't exist
        uint256 id = uint256(keccak256(abi.encode(parentId, domain)));
        _mint(_owner, id);
        Entry storage entry = entries[id];
        entry.ref = _ref;
        entry.controller = _controller;
        RegistryCreated(parentId, domain, _owner, _controller, _ref);
    }

    function createRegistry(
        uint256 parentId,
        string calldata domain,
        address _owner,
        address _controller,
        string calldata _ref
    ) public onlyDomainOwner(parentId) {
        _createRegistry(parentId, domain, _owner, _controller, _ref);
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

    function validateString(string memory _s)
        public
        pure
        returns (
            bool valid,
            bytes32 parent,
            string memory domain,
            bytes memory debug
        )
    {
        debug = bytes(_s);
        (valid, parent, domain) = strings.validateDomain(_s);
    }
    function getIpfsHash(string memory _s) public view returns (bytes memory) {
        // (bool valid, , ) = validateString(_s);
        return verifyIPFS.generateHash(_s);
    }
}
