pragma solidity ^0.7.6;

pragma abicoder v2;

/**
 * @title ZNSRegistry
 * @dev Create and interact with Zero Namespace domains.
 */

import "@openzeppelin/contracts/utils/Address.sol";
import "./ERC721Upgradeable.sol";
import "./IZNSController.sol";

contract ZNSRegistry is ERC721UpgradeableCustom {
    using Address for address;

    enum ChildLockablePropertiesRule {NULL, LOCKED, UNLOCKED}

    /**
     * @notice Entry
     * entries are id'd by keccak(abi.encode(parentId, subdomainString))
     * @param controller is the role which may create child domains
     * @param domain is the full domain path
     * @param properties contains ipfs hash of metadata - will be a json payload
     * that can specify various meanings to a domain some of which will be in
     * json payload from tokenURI
     * @param childCreateLimit this value sets how many children a child of this domain can set
     * @param childLockablePropertiesRule - tokenized art is a major use case, so we allow domains to
     * permanently lock the lockablePropertiess of children once set
     */
    struct Entry {
        uint256 parent;
        uint256 depth;
        address controller;
        address creator;
        string name;
        string properties;
        string lockableProperties;
        uint256 childCreateLimit;
        uint256 childCount;
        ChildLockablePropertiesRule childLockablePropertiesRule;
    }

    struct EntryView {
        address owner;
        uint256 parent;
        uint256 depth;
        address controller;
        address creator;
        string name;
        string domain;
        string properties;
        string lockableProperties;
        uint256 createLimit;
        uint256 childCreateLimit;
        uint256 childCount;
        ChildLockablePropertiesRule lockablePropertiesRule;
        ChildLockablePropertiesRule childLockablePropertiesRule;
    }

    /// @dev Index is domain ID, i.e. keccak256(abi.encode(parentId, subdomainString))
    mapping(uint256 => Entry) internal _entries;

    // @dev We have a specially constructed root ID, capitals are not permitted,
    // so this an exception to the rule ROOT is *not* part of any domain strings
    uint256 public constant ROOT_ID =
        uint256(keccak256(abi.encode(uint256(0), "ROOT")));

    event DomainCreated(
        uint256 indexed parentId,
        uint256 tokenId,
        string name,
        address owner
    );

    event LockablePropertiesSet(address indexed owner, uint256 indexed id, string lockableProperties);

    event ChildCreateLimitSet(
        address indexed owner,
        uint256 indexed id,
        uint256 childCreateLimit
    );

    event PropertiesSet(
        address indexed owner,
        uint256 indexed id,
        string properties
    );

    event ControllerSet(
        uint256 indexed id,
        address indexed oldController,
        address indexed newController,
        address sender
    );

    event ChildLockablePropertiesRuleSet(
        address indexed owner,
        uint256 indexed id,
        ChildLockablePropertiesRule rule
    );

    event BaseURISet(string baseURI);

    /**
     * @dev We mint and set controller after DomainCreated to be
     * consistent with how we do things in the domain creator functions.
     */
    function initialize(address _owner, address _controller)
        public
        initializer
    {
        __ERC721_init("Zer0 Name Service", "ZNS");
        Entry storage entry = _entries[ROOT_ID];
        entry.name = "ROOT";
        /// @dev permanently unlock all TLD lockablePropertiess
        _entries[0].childLockablePropertiesRule = ChildLockablePropertiesRule.UNLOCKED;
        DomainCreated(0, ROOT_ID, "ROOT", _owner);
        _mint(_owner, ROOT_ID);
        _setController(ROOT_ID, _controller);
    }

    function entryOf(uint256 id) external view returns (EntryView memory out) {
        Entry storage entry = _entries[id];
        Entry storage parent = _entries[entry.parent];
        out.owner = ownerOf(id);
        out.parent = entry.parent;
        out.depth = entry.depth;
        out.controller = entry.controller;
        out.creator = entry.creator;
        out.name = entry.name;
        // out.domain = entry.domain;
        out.properties = entry.properties;
        out.lockableProperties = entry.lockableProperties;
        out.createLimit = parent.childCreateLimit;
        out.childCreateLimit = entry.childCreateLimit;
        out.childCount = entry.childCount;
        out.lockablePropertiesRule = parent.childLockablePropertiesRule;
        out.childLockablePropertiesRule = entry.childLockablePropertiesRule;
    }

    /**
     * @notice getters
     */

    function parentOf(uint256 id) external view returns (uint256) {
        return _entries[id].parent;
    }

    function depthOf(uint256 id) external view returns (uint256) {
        return _entries[id].depth;
    }

    function controllerOf(uint256 id) public view returns (address) {
        return _entries[id].controller;
    }

    function creatorOf(uint256 id) public view returns (address) {
        return _entries[id].creator;
    }

    function nameOf(uint256 id) public view returns (string memory) {
        return _entries[id].name;
    }

    function propertiesOf(uint256 id) public view returns (string memory) {
        return _entries[id].properties;
    }

    function lockablePropertiesOf(uint256 id) public view returns (string memory) {
        return _entries[id].lockableProperties;
    }

    function childCreateLimitOf(uint256 id) public view returns (uint256) {
        return _entries[id].childCreateLimit;
    }

    /// @notice the createLimit of selected domain is the childCreateLimit of its parent
    function createLimitOf(uint256 id) public view returns (uint256) {
        return childCreateLimitOf(_entries[id].parent);
    }

    function childCountOf(uint256 id) external view returns (uint256) {
        return _entries[id].childCount;
    }

    function childLockablePropertiesRuleOf(uint256 id) public view returns (ChildLockablePropertiesRule) {
        return _entries[id].childLockablePropertiesRule;
    }

    /// @notice the lockablePropertiesRule of selected domain is the childLockablePropertiesRule of its parent
    function lockablePropertiesRuleOf(uint256 id) public view returns (ChildLockablePropertiesRule) {
        return childLockablePropertiesRuleOf(_entries[id].parent);
    }

    /// @notice if controller is not set, then the owner may act as controller
    /// root domain owner may always act as its own controller
    function controllerLikeOf(address creator, uint256 id)
        public
        view
        returns (bool)
    {
        address controller = controllerOf(id);
        return
            creator == controller ||
            ((controller == address(0) || id == ROOT_ID) &&
                ownerOf(id) == creator);
    }

    function exists(uint256 id) external view returns (bool) {
        return _exists(id);
    }

    function getId(string[] memory path) public pure returns (uint256) {
        uint256 _id = ROOT_ID;
        for (uint256 i = 0; i < path.length; i++) {
            _id = uint256(keccak256(abi.encode(_id, path[i])));
        }
        return _id;
    }

    function calcId(uint256 parentId, string memory name)
        public
        pure
        returns (uint256)
    {
        return uint256(keccak256(abi.encode(parentId, name)));
    }

    /// @notice validates that a string consists of only alphanumeric chars + dash
    function validateName(string memory name) public pure returns (bool) {
        uint256 iptr;
        bytes32 ptrdata;
        uint256 _len = bytes(name).length;
        uint256 stop32 = _len / 32;
        assembly {
            iptr := add(name, 0x20)
        }
        uint256 stopPtr = iptr + stop32;
        for (; iptr < stopPtr; iptr++) {
            assembly {
                ptrdata := mload(iptr)
            }
            /// @dev 32 bytes * 8 bits/byte = 256 bits
            for (uint256 j = 0; j < 256; j += 8) {
                uint8 _char = uint8(bytes1(ptrdata << j));
                /// @dev UTF8 97->122 is lowercase letters, 48-57 is numbers, 45 is '-'
                if (
                    (_char < 97 || _char > 122) &&
                    (_char < 48 || _char > 57) &&
                    (_char != 45)
                ) {
                    return false;
                }
            }
        }
        if (stop32 * 32 < _len) {
            assembly {
                ptrdata := mload(iptr)
            }
            uint256 stop1 = (_len - stop32 * 32) * 8;
            for (uint256 j = 0; j < stop1; j += 8) {
                uint8 _char = uint8(bytes1(ptrdata << j));
                if (
                    (_char < 97 || _char > 122) &&
                    (_char < 48 || _char > 57) &&
                    (_char != 45)
                ) {
                    return false;
                }
            }
        }
        return true;
    }

    // TODO: not very important, would never be called by a contract
    // basically just an etherscan utility function, or for ppl not querying subgraph
    // function domainOf(uint256 id) public view returns (string memory) {
    //     if (id == ROOT_ID) {
    //         return "ROOT";
    //     }
    //     uint256 i;
    //     string[] memory names = new string(256);
    //     uint256 len = 0;
    //     for (; id != ROOT_ID; i++) {
    //         Entry storage entry = _entries[id];
    //         names[i] = entry.name;
    //         len += bytes(names[i]).length + 1;
    //         id = entry.parentId;
    //     }
    //     len -= 1;
    //     string memory out = new string(len);
    //     uint256 iptr;
    //     assembly {
    //         iptr := add(out, 0x20)
    //     }
    //     for (; 1 < i; i--) {
    //         uint partLen = bytes(names[i]).length + 1;
    //         for (; len >= 32; len -= 32) {
    //             assembly {
    //                 mstore(dest, mload(src))
    //             }
    //             dest += 32;
    //             src += 32;
    //         }

    //         // Copy remaining bytes
    //         uint256 mask = 256**(32 - len) - 1;
    //         assembly {
    //             let srcpart := and(mload(src), not(mask))
    //             let destpart := and(mload(dest), mask)
    //             mstore(dest, or(destpart, srcpart))
    //         }
    //     }
    // }

    /**
     * @notice setters - we save controller for last, as it's the most involved
     */

    function setLockableProperties(uint256 id, string memory lockableProperties) external {
        require(ownerOf(id) == msg.sender);
        Entry storage entry = _entries[id];
        require(
            _entries[entry.parent].childLockablePropertiesRule != ChildLockablePropertiesRule.LOCKED ||
                bytes(entry.lockableProperties).length == 0
        );
        entry.lockableProperties = lockableProperties;
        emit LockablePropertiesSet(ownerOf(id), id, lockableProperties);
    }

    function setProperties(uint256 id, string calldata properties) external {
        require(ownerOf(id) == msg.sender);
        _entries[id].properties = properties;
        emit PropertiesSet(ownerOf(id), id, properties);
    }

    /**
     * @notice we may only increase the childCreateLimit
     * we make an exception for the 0 point, used exclusively here, and may be set by ROOT
     * for all other intents and purposes the 0 point does not exist, and is not a token
     */
    function setChildCreateLimit(uint256 id, uint256 childCreateLimit)
        external
    {
        address owner = id == 0 ? ownerOf(ROOT_ID) : ownerOf(id);
        require(owner == msg.sender);
        require(childCreateLimit > _entries[id].childCreateLimit);
        _entries[id].childCreateLimit = childCreateLimit;
        emit ChildCreateLimitSet(owner, id, childCreateLimit);
    }

    /**
     * @notice once set to nonnull, cannot be set again
     * Cannot be set for root, as TLD's may change their lockableProperties at whim
     */
    function setChildLockablePropertiesRule(uint256 id, ChildLockablePropertiesRule rule) external {
        require(ownerOf(id) == msg.sender);
        require(childLockablePropertiesRuleOf(id) == ChildLockablePropertiesRule.NULL);
        _setChildLockablePropertiesRule(id, rule);
    }

    function _setChildLockablePropertiesRule(uint256 id, ChildLockablePropertiesRule rule) internal {
        _entries[id].childLockablePropertiesRule = rule;
        emit ChildLockablePropertiesRuleSet(ownerOf(id), id, rule);
    }

    /// @notice can only be set by owner of ROOT_ID
    function setBaseURI(string memory baseURI) external {
        require(msg.sender == ownerOf(ROOT_ID));
        _setBaseURI(baseURI);
        emit BaseURISet(baseURI);
    }

    /**
     * @notice Controller setting logic
     * We use a pattern that is nearly identical to onERC721Received
     * and safeTransferFrom/safeMint for setting controllers, in certain cases
     * this is utilized by staking logic in StakingController and DynamicStakingController.
     * safeSetController fires the onZnsSetController callback on the controller
     * if that address is a contract, and assert that the return value is the
     * function selector. We implement both safe and unsafe controller setting logic;
     */

    function _setController(uint256 id, address controller) internal {
        address oldController = controllerOf(id);
        _entries[id].controller = controller;
        emit ControllerSet(id, oldController, controller, msg.sender);
    }

    function _safeSetController(
        uint256 id,
        address controller,
        bytes memory _data
    ) internal {
        address oldController = controllerOf(id);
        _entries[id].controller = controller;
        emit ControllerSet(id, oldController, controller, msg.sender);
        /**
         * @dev
         * we first set controller and emit event, then we fire _checkOnSetController
         * because some flows will set the controller once more
         */
        require(
            _checkOnSetController(oldController, controller, id, _data),
            "ZNSRegistry._checkOnSetController: not a valid controller"
        );
    }

    function setController(uint256 id, address controller) external {
        require(controllerLikeOf(msg.sender, id));
        _setController(id, controller);
    }

    function safeSetController(
        uint256 id,
        address controller,
        bytes calldata _data
    ) external {
        require(controllerLikeOf(msg.sender, id));
        _safeSetController(id, controller, _data);
    }

    /**
     * @notice Domain creation logic
     * We provide an unsafe creator, a creator with only safe controller setting.
     * a controller for only safe minting, and one with both controller and minting safe.
     * See notice above controller setting logic
     */

    /**
     * @dev _createDomainEntry does all of the creation and relevant assertions except
     * for setting the controller and minting - we leave that separate for the safe cases
     * We return id so that controller contracts may retrieve it without recomputing
     */
    function _createDomainEntry(
        uint256 parentId,
        string calldata name,
        address _owner
    ) internal returns (uint256) {
        require(bytes(name).length > 0);
        require(validateName(name), "domain did not validate");
        uint256 id = uint256(keccak256(abi.encode(parentId, name)));
        require(controllerLikeOf(msg.sender, parentId), "sender cant create");
        require(_exists(parentId), "parent doesn't exist");
        require(!_exists(id), "domain already created");
        Entry storage parent = _entries[parentId];
        require(
            parent.childCount + 1 <= childCreateLimitOf(parent.parent),
            "Child limit reached"
        );
        parent.childCount++;
        Entry storage entry = _entries[id];
        entry.depth = parent.depth + 1;
        entry.parent = parentId;
        entry.name = name;
        entry.creator = _owner;
        DomainCreated(parentId, id, name, _owner);
        /**
         * @dev if parent child lockableProperties rule is locked, keep it locked
         * for derivative works and gallery domains
         */
        if (parent.childLockablePropertiesRule == ChildLockablePropertiesRule.LOCKED) {
            _setChildLockablePropertiesRule(id, ChildLockablePropertiesRule.LOCKED);
        }
        return id;
    }

    function createDomain(
        uint256 parentId,
        string calldata name,
        address _owner,
        address _controller
    ) public returns (uint256 id) {
        id = _createDomainEntry(parentId, name, _owner);
        _mint(_owner, id);
        _setController(id, _controller);
    }

    function safeCreateDomain(
        uint256 parentId,
        string calldata name,
        address _owner,
        address _controller,
        bytes calldata mintData,
        bytes calldata controllerData
    ) public returns (uint256 id) {
        id = _createDomainEntry(parentId, name, _owner);
        _safeMint(_owner, id, mintData);
        _safeSetController(id, _controller, controllerData);
    }

    function createDomainSafeController(
        uint256 parentId,
        string calldata name,
        address _owner,
        address _controller,
        bytes calldata controllerData
    ) public returns (uint256 id) {
        id = _createDomainEntry(parentId, name, _owner);
        _mint(_owner, id);
        _safeSetController(id, _controller, controllerData);
    }

    function createDomainSafeMint(
        uint256 parentId,
        string calldata name,
        address _owner,
        address _controller,
        bytes calldata mintData
    ) public returns (uint256 id) {
        id = _createDomainEntry(parentId, name, _owner);
        _safeMint(_owner, id, mintData);
        _setController(id, _controller);
    }

    /// @dev see notice above set controller logic
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