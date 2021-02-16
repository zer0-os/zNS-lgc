pragma solidity ^0.7.6;

pragma abicoder v2;

/**
 * @title ZNSRegistry
 * @dev Create and interact with Zero Namespace domains.
 */

import "@openzeppelin/contracts/utils/Address.sol";
import "./ERC721Upgradeable.sol";
import "./strings.sol";
import "./strings.sol";
import "./IZNSController.sol";

contract ZNSRegistry is ERC721UpgradeableCustom {
    using Address for address;

    enum ChildImageRule {NULL, LOCKED, UNLOCKED}

    /**
     * @notice Entry
     * entries are id'd by keccak(abi.encode(parentId, subdomainString))
     * @param controller is the role which may create child domains
     * @param domain is the full domain path
     * @param resolver contains ipfs hash of metadata - will be a json payload
     * that can specify various meanings to a domain some of which will be in
     * json payload from tokenURI
     * @param childCreateLimit this value sets how many children a child of this domain can set
     * @param childImageRule - tokenized art is a major use case, so we allow domains to
     * permanently lock the images of children once set
     */
    struct Entry {
        uint256 parent;
        uint256 depth;
        address controller;
        string domain;
        string resolver;
        string image;
        uint256 childCreateLimit;
        uint256 childCount;
        ChildImageRule childImageRule;
    }

    struct EntryView {
        address owner;
        uint256 parent;
        uint256 depth;
        address controller;
        string domain;
        string resolver;
        string image;
        uint256 createLimit;
        uint256 childCreateLimit;
        uint256 childCount;
        ChildImageRule imageRule;
        ChildImageRule childImageRule;
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
        string domain,
        address owner
    );

    event ImageSet(address indexed owner, uint256 indexed id, string image);

    event ChildCreateLimitSet(
        address indexed owner,
        uint256 indexed id,
        uint256 childCreateLimit
    );

    event ResolverSet(
        address indexed owner,
        uint256 indexed id,
        string resolver
    );

    event ControllerSet(
        uint256 indexed id,
        address indexed oldController,
        address indexed newController,
        address sender
    );

    event ChildImageRuleSet(
        address indexed owner,
        uint256 indexed id,
        ChildImageRule rule
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
        entry.domain = "ROOT";
        /// @dev permanently unlock all TLD images
        _entries[0].childImageRule = ChildImageRule.UNLOCKED;
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
        out.domain = entry.domain;
        out.resolver = entry.resolver;
        out.image = entry.image;
        out.createLimit = parent.childCreateLimit;
        out.childCreateLimit = entry.childCreateLimit;
        out.childCount = entry.childCount;
        out.imageRule = parent.childImageRule;
        out.childImageRule = entry.childImageRule;
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

    function domainOf(uint256 id) public view returns (string memory) {
        return _entries[id].domain;
    }

    function resolverOf(uint256 id) public view returns (string memory) {
        return _entries[id].resolver;
    }

    function imageOf(uint256 id) public view returns (string memory) {
        return _entries[id].image;
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

    function childImageRuleOf(uint256 id) public view returns (ChildImageRule) {
        return _entries[id].childImageRule;
    }

    /// @notice the imageRule of selected domain is the childImageRule of its parent
    function imageRuleOf(uint256 id) public view returns (ChildImageRule) {
        return childImageRuleOf(_entries[id].parent);
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

    /// @notice For reading from chain and by controllers that have a multistep
    /// creation cycle that need to know parent and child
    function getIdAndParent(string memory _s)
        public
        pure
        returns (uint256, uint256)
    {
        (bool valid, uint256 parent, string memory domain) =
            strings.parseDomain(ROOT_ID, _s);
        require(valid);
        uint256 id = uint256(keccak256(abi.encode(parent, domain)));
        return (id, parent);
    }

    function getId(string[] memory path) public pure returns (uint256) {
        uint256 _id = ROOT_ID;
        for (uint256 i = 0; i < path.length; i++) {
            _id = uint256(keccak256(abi.encode(_id, path[i])));
        }
        return _id;
    }

    function parseDomain(string memory _s)
        public
        pure
        returns (
            bool valid,
            uint256 parent,
            uint256 id,
            string memory domain
        )
    {
        (valid, parent, domain) = strings.parseDomain(ROOT_ID, _s);
        id = uint256(keccak256(abi.encode(parent, domain)));
    }

    /**
     * @notice setters - we save controller for last, as it's the most involved
     */

    function setImage(uint256 id, string memory image) external {
        require(ownerOf(id) == msg.sender);
        Entry storage entry = _entries[id];
        require(
            _entries[entry.parent].childImageRule != ChildImageRule.LOCKED ||
                bytes(entry.image).length == 0
        );
        entry.image = image;
        emit ImageSet(ownerOf(id), id, image);
    }

    function setResolver(uint256 id, string calldata resolver) external {
        require(ownerOf(id) == msg.sender);
        _entries[id].resolver = resolver;
        emit ResolverSet(ownerOf(id), id, resolver);
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
        require(childCreateLimit >= _entries[id].childCreateLimit);
        _entries[id].childCreateLimit = childCreateLimit;
        emit ChildCreateLimitSet(owner, id, childCreateLimit);
    }

    /**
     * @notice once set to nonnull, cannot be set again
     * Cannot be set for root, as TLD's may change their image at whim
     */
    function setChildImageRule(uint256 id, ChildImageRule rule) external {
        require(ownerOf(id) == msg.sender);
        require(childImageRuleOf(id) == ChildImageRule.NULL);
        _setChildImageRule(id, rule);
    }

    function _setChildImageRule(uint256 id, ChildImageRule rule) internal {
        _entries[id].childImageRule = rule;
        emit ChildImageRuleSet(ownerOf(id), id, rule);
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
     * for setting the controller and mining - we leave that separate for the safe cases
     */

    /**
     * @dev
     * We return id and parentId so that controller contracts may get both
     * without parsing the domain string again
     */
    function _createDomainEntry(string calldata domain, address _owner)
        internal
        returns (uint256, uint256)
    {
        require(bytes(domain).length > 0);
        (bool succ, uint256 parentId, string memory child) =
            strings.parseDomain(ROOT_ID, domain);
        uint256 id = uint256(keccak256(abi.encode(parentId, child)));
        require(succ, "domain failed to parse");
        require(controllerLikeOf(msg.sender, parentId), "sender cant create");
        require(_exists(parentId), "parent doesn't exist");
        require(!_exists(id), "domain already created");
        Entry storage parent = _entries[parentId];
        require(
            parent.childCount + 1 < childCreateLimitOf(parent.parent),
            "Child limit reached"
        );
        parent.childCount++;
        Entry storage entry = _entries[id];
        entry.depth = parent.depth + 1;
        entry.parent = parentId;
        entry.domain = domain;
        DomainCreated(parentId, id, domain, _owner);
        /**
         * @dev if parent child image rule is locked, keep it locked
         * for derivative works and gallery domains
         */
        if (parent.childImageRule == ChildImageRule.LOCKED) {
            _setChildImageRule(id, ChildImageRule.LOCKED);
        }
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
