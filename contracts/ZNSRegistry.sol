pragma solidity ^0.7.6;
pragma experimental ABIEncoderV2;
// ABIEncoderV2 only used for view functions

/**
 * @title Registry
 * @dev Create and interact with Registries.
 */

import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721MetadataUpgradeable.sol";
import "./strings.sol";
import "./IPFSHash.sol";
import "./strings.sol";
import "./IZNSController.sol";

contract ZNSRegistry is ERC721Upgradeable {
    using AddressUpgradeable for address;
    struct Entry {
        uint256 parent;
        uint256 depth;
        address controller; // can create children
        //    address registrar; // can set controller
        string resolver;
        string domain;
        string image;
        uint256 childLimit;
        uint256 childCount;
    }

    struct EntryView {
        address owner;
        uint256 parent;
        uint256 depth;
        address controller; // can create children
        string resolver;
        string image;
        string domain;
        uint256 childLimit;
        uint256 childCount;
    }

    mapping(uint256 => Entry) internal _entries;

    uint256 public constant ROOT_ID =
        uint256(keccak256(abi.encode(uint256(0), "ROOT")));

    event DomainCreated(
        uint256 indexed parentId,
        uint256 tokenId,
        string domain,
        address owner
    );

    event ImageSet(address indexed owner, uint256 indexed id, string image);

    event ChildLimitSet(
        address indexed owner,
        uint256 indexed id,
        uint256 childLimit
    );

    event ResolverSet(
        address indexed owner,
        uint256 indexed id,
        string resolver
    );

    //event RegistrarSet(
    //    uint indexed id,
    //    address indexed oldRegistrar,
    //    address indexed newRegistrar
    //);

    event ControllerSet(
        uint256 indexed id,
        address indexed oldController,
        address indexed newController,
        address sender
    );

    function initialize(
        address _owner,
        address _controller,
        string memory image,
        uint256 childLimit
    ) public initializer {
        __ERC721_init("Zer0 Name Service", "ZNS");
        _mint(_owner, ROOT_ID);
        Entry storage entry = _entries[ROOT_ID];
        DomainCreated(0, ROOT_ID, "ROOT", _owner);
        _setController(ROOT_ID, _controller);
        setImage(ROOT_ID, image);
        setChildLimit(ROOT_ID, childLimit);
    }

    // function getRegistrar(uint id) external view returns (address) {
    //     return _entries[id].registrar;
    // }

    function childCountOf(uint256 id) external view returns (uint256) {
        return _entries[id].childCount;
    }

    function depthOf(uint256 id) external view returns (uint256) {
        return _entries[id].depth;
    }

    function parentOf(uint256 id) external view returns (uint256) {
        return _entries[id].parent;
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

    function canCreate(address creator, uint256 id) public returns (bool) {
        // address registrar = registrarOf(id);
        address controller = controllerOf(id);
        return
            creator == controller ||
            (controller == address(0) && ownerOf(id) == creator);
        // return creator == registrar || creator == controller || uint256(registrar)|uint256(controller) == 0;
    }

    // function registrarOf(uint256 id) public view returns (address) {
    //     return _entries[id].registrar;
    // }

    function controllerOf(uint256 id) public view returns (address) {
        return _entries[id].controller;
    }

    function setChildLimit(uint256 id, uint256 childLimit) public {
        require(ownerOf(id) == msg.sender);
        require(childLimit >= _entries[id].childLimit);
        _entries[id].childLimit = childLimit;
        emit ChildLimitSet(ownerOf(id), id, childLimit);
    }

    function setImage(uint256 id, string memory image) public {
        require(ownerOf(id) == msg.sender);
        _entries[id].image = image;
        emit ImageSet(ownerOf(id), id, image);
    }

    function setResolver(uint256 id, string calldata resolver) public {
        require(ownerOf(id) == msg.sender);
        _entries[id].resolver = resolver;
        emit ResolverSet(ownerOf(id), id, resolver);
    }

    // function setRegistrar(uint id, address registrar) public {
    //     require(registrarOf(id) == msg.sender);
    //     _entries[id].registrar = registrar;
    //     emit RegistrarSet(id, registrarOf(id), registrar);
    // }

    function _setController(uint256 id, address controller) internal {
        _entries[id].controller = controller;
        emit ControllerSet(id, controllerOf(id), controller, msg.sender);
    }

    function _safeSetController(
        uint256 id,
        address controller,
        bytes memory _data
    ) internal {
        address oldController = controllerOf(id);
        _entries[id].controller = controller;
        emit ControllerSet(id, oldController, controller, msg.sender);
        // we fire _checkOnSetController after we set controller and emit event, because
        // some flows will set the controller once more
        require(
            _checkOnSetController(oldController, controller, id, _data),
            "not a valid controller"
        );
    }

    function setController(uint256 id, address controller) external {
        require(canCreate(msg.sender, id));
        _setController(id, controller);
    }

    function safeSetController(
        uint256 id,
        address controller,
        bytes calldata _data
    ) external {
        require(canCreate(msg.sender, id));
        _safeSetController(id, controller, _data);
    }

    function entryOf(uint256 id) external view returns (EntryView memory out) {
        Entry storage entry = _entries[id];
        out.owner = ownerOf(id);
        out.parent = entry.parent;
        out.controller = entry.controller;
        out.domain = entry.domain;
        out.childLimit = entry.childLimit;
        out.childCount = entry.childCount;
        out.image = entry.image;
    }

    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override {
        ERC721Upgradeable._transfer(from, to, tokenId);
    }

    function tokenURI(uint256 token)
        public
        view
        override
        returns (string memory out)
    {
        out = string(
            abi.encodePacked(
                "ipfs://",
                verifyIPFS.generateHash(
                    string(
                        abi.encodePacked(
                            '{"name":"',
                            _entries[token].domain,
                            '"}'
                        )
                    )
                )
            )
        );
    }

    function _createDomainEntry(string calldata domain, address _owner)
        internal
        returns (uint256, uint256)
    {
        require(bytes(domain).length > 0);
        (bool succ, uint256 parentId, string memory child) =
            strings.validateDomain(ROOT_ID, domain);
        uint256 id = uint256(keccak256(abi.encode(parentId, child)));
        require(succ, "domain failed to validate");
        require(canCreate(msg.sender, parentId), "sender cant create");
        require(_exists(parentId), "parent doesn't exist");
        require(!_exists(id), "domain already created");
        Entry storage parent = _entries[parentId];
        require(
            parent.childCount + 1 < parent.childLimit,
            "Child limit reached"
        );
        parent.childCount++;
        Entry storage entry = _entries[id];
        entry.depth = parent.depth + 1;
        entry.parent = parentId;
        entry.domain = domain;
        DomainCreated(parentId, id, domain, _owner);
        return (id, parentId);
    }

    function createDomain(
        string calldata domain,
        address _owner,
        address _controller
    ) public returns (uint256 id, uint256 parentId) {
        (id, parentId) = _createDomainEntry(domain, _owner);
        _mint(_owner, id);
        _setController(id, _controller);
    }

    function safeCreateDomain(
        string calldata domain,
        address _owner,
        address _controller,
        bytes calldata mintData,
        bytes calldata controllerData
    ) public returns (uint256 id, uint256 parentId) {
        (id, parentId) = _createDomainEntry(domain, _owner);
        _safeMint(_owner, id, mintData);
        _safeSetController(id, _controller, controllerData);
    }

    function createDomainSafeController(
        string calldata domain,
        address _owner,
        address _controller,
        bytes calldata controllerData
    ) public returns (uint256 id, uint256 parentId) {
        (id, parentId) = _createDomainEntry(domain, _owner);
        _mint(_owner, id);
        _safeSetController(id, _controller, controllerData);
    }

    function createDomainSafeMint(
        string calldata domain,
        address _owner,
        address _controller,
        bytes calldata mintData
    ) public returns (uint256 id, uint256 parentId) {
        (id, parentId) = _createDomainEntry(domain, _owner);
        _safeMint(_owner, id, mintData);
        _setController(id, _controller);
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
        (valid, parent, domain) = strings.validateDomain(ROOT_ID, _s);
        id = uint256(keccak256(abi.encode(parent, domain)));
    }

    function exists(uint256 id) external view returns (bool) {
        return _exists(id);
    }

    function getIdAndParent(string memory _s)
        public
        pure
        returns (uint256, uint256)
    {
        (bool valid, uint256 parent, string memory domain) =
            strings.validateDomain(ROOT_ID, _s);
        require(valid);
        uint256 id = uint256(keccak256(abi.encode(parent, domain)));
        return (id, parent);
    }

    function _checkOnSetController(
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) internal returns (bool) {
        if (to.isContract()) {
            try
                IZNSController(to).onSetZnsController(
                    _msgSender(),
                    from,
                    tokenId,
                    _data
                )
            returns (bytes4 retval) {
                return retval == IZNSController.onSetZnsController.selector;
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert(
                        "ZNSRegistry: controller set to non ZNSController implementer"
                    );
                } else {
                    // solhint-disable-next-line no-inline-assembly
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        } else {
            return true;
        }
    }
}
