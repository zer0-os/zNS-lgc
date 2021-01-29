pragma solidity ^0.7.6;
pragma experimental ABIEncoderV2;
// ABIEncoderV2 only used for view functions

/**
 * @title Registry
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

contract Registry is ERC721Upgradeable {
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.UintSet;
    struct Entry {
        uint256 parent;
        uint256 depth;
        address controller; // can create children
    //    address registrar; // can set controller
        string resolver;
        string domain;
        string image;
        // string description;
        // maybe just keep it a ref counter
        // one loses enumerability with view methods tho
        EnumerableSetUpgradeable.UintSet children;
    }

    struct EntryView {
        address owner;
        uint256 parent;
        uint256 depth;
        address controller; // can create children
   //     address registrar; // can set controller
        string resolver;
        string image;
        string domain;
        uint256[] children;
    }

    mapping(uint256 => Entry) internal _entries;

    uint constant public ROOT_ID = uint256(keccak256(abi.encode(uint256(0), "ROOT")));

    event DomainCreated(
        uint256 indexed parentId,
        uint256 tokenId,
        string domain,
        address owner,
  //      address registrar,
        address controller,
        string resolver,
        string image
    );

    event ImageSet(address indexed owner, uint indexed id, string image);

    event ResolverSet(address indexed owner, uint indexed id, string resolver);

    //event RegistrarSet(
    //    uint indexed id,
    //    address indexed oldRegistrar,
    //    address indexed newRegistrar
    //);

    event ControllerSet(
        uint indexed id,
        address indexed oldController,
        address indexed newController,
        address sender
    );


    constructor(address _owner, address _controller, string memory _resolver, string memory _image) public {
        __ERC721_init("Zer0 Name Service", "ZNS");
        _mint(_owner, ROOT_ID);
        Entry storage entry = _entries[ROOT_ID];
        entry.controller = _controller;
        entry.image = _image;
        DomainCreated(0, ROOT_ID, "ROOT", _owner, _controller, _resolver, _image);
    }

    // function getRegistrar(uint id) external view returns (address) {
    //     return _entries[id].registrar;
    // }

    function getChildLength(uint id) external view returns (uint) {
        return _entries[id].children.length();
    }

    function getDepth(uint id) external view returns (uint) {
        return _entries[id].depth;
    }

    function _onlyDomainOwner(uint256 id) internal {
        require(ownerOf(id) == msg.sender);
    }

    modifier onlyDomainOwner(uint256 id) {
        require(ownerOf(id) == msg.sender);
        _;
    }

    modifier onlyDomainController(uint256 id) {
        require(controllerOf(id) == msg.sender);
        _;
    }

    modifier onlyDomainRegistar(uint256 id) {
        require(ownerOf(id) == msg.sender);
        _;
    }
    
    function canCreate(address creator, uint id) public returns (bool) {
        // address registrar = registrarOf(id);
        address controller = controllerOf(id);
        return creator == controller;
        // return creator == registrar || creator == controller || uint256(registrar)|uint256(controller) == 0;
    }

   // function registrarOf(uint256 id) public view returns (address) {
   //     return _entries[id].registrar;
   // }
    
    function controllerOf(uint256 id) public view returns (address) {
        return _entries[id].controller;
    }

    function setImage(uint id, string calldata image) public {
        require(ownerOf(id) == msg.sender);
        _entries[id].image = image;
        emit ImageSet(ownerOf(id), id, image);
    }

    function setResolver(uint id, string calldata resolver) public {
        require(ownerOf(id) == msg.sender);
        _entries[id].resolver = resolver;
        emit ResolverSet(ownerOf(id), id, resolver);
    }

    // function setRegistrar(uint id, address registrar) public {
    //     require(registrarOf(id) == msg.sender);
    //     _entries[id].registrar = registrar;
    //     emit RegistrarSet(id, registrarOf(id), registrar);
    // }

    function setController(uint id, address controller) public {
        require(canCreate(msg.sender, id));
        _entries[id].controller = controller;
        emit ControllerSet(id, controllerOf(id), controller, msg.sender);
    }

    // paginate children
    function entries(uint256 id) external view returns (EntryView memory out) {
        Entry storage entry = _entries[id];
        out.owner = ownerOf(id);
        out.parent = entry.parent;
        // out.registrar = entry.registrar;
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
        ERC721Upgradeable._transfer(from, to, tokenId);
    }

    function tokenURI(uint256 token) public view override returns (string memory out) {
        out = string(abi.encodePacked("ipfs://",verifyIPFS.generateHash(string(abi.encodePacked('{"name":"', _entries[token].domain,'"}')))));
        // return _entries[token].domain;
    }

    function _createDomain(
        // uint256 parentId
        string calldata domain,
        address _owner,
        address _controller,
        // address _registrar,
        string calldata _resolver,
        string calldata _image
    ) internal {
        // require(bytes(domain).length > 0); // is this necessary if gov controls tld?
        (bool succ, uint256 parentId, string memory child) = strings.validateDomain(ROOT_ID,domain);
        require(succ, "domain failed to validate");
        uint256 id = uint256(keccak256(abi.encode(parentId, child)));
        require(canCreate(msg.sender, parentId), "sender cant create");
        require(_entries[parentId].children.add(id), "domain already in children");
        _mint(_owner, id);
        {   // evade stack too deep
            Entry storage parent = _entries[parentId];
            Entry storage entry = _entries[id];
            entry.depth = parent.depth + 1;
            entry.parent = parentId;
            entry.resolver = _resolver;
            entry.domain = domain;
            entry.controller = _controller;
            // entry.registrar = _registrar;
            entry.image = _image;
        }
        DomainCreated(parentId, id, domain, _owner, _controller, _resolver, _image);
    }

    function createDomain(
        // uint256 parentId,
        string calldata domain,
        address _owner,
        address _controller,
        string calldata resolver,
        string calldata image 
    ) public {
        _createDomain(domain, _owner, _controller, resolver, image);
    }

    function getId(string[] memory path) public pure returns (uint256) {
        uint256 _id = ROOT_ID;
        for (uint256 i = 0; i < path.length; i++) {
            _id = uint256(keccak256(abi.encode(_id, path[i])));
        }
        return _id;
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
            uint256 id,
            string memory domain
        )
    {
        (valid, parent, domain) = strings.validateDomain(ROOT_ID,_s);
        id = uint256(keccak256(abi.encode(parent, domain)));
    }


}
