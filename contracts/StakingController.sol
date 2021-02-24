pragma solidity ^0.7.6;

pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./ZNSRegistry.sol";
import "./IZNSController.sol";

interface IBancorRegistry {
    function addressOf(bytes32) external view returns (address);
}

interface IBancorNetwork {
   function convertByPath(
        address[] memory _path,
        uint256 _amount,
        uint256 _minReturn,
        address payable _beneficiary,
        address _affiliateAccount,
        uint256 _affiliateFee
      ) external payable returns (uint256);
}
/**
 * @notice This is a ZNS controller that implements an auction system for domains, however instead
 * of there being a beneficiary, tokens are permanently locked. A bid includes also the controller
 * and the data which will be forwarded to the safe controller data in the domain creator on the.
 * registry, as well as a proposal IPFS hash which includes a value description of the purpose or
 * value prop of the domain to be staked. Once the staking token for a domain has been set, it cannot
 * be changed, however, the minimum bid may be updated at whim. Bids are accepted at the whim of the
 * parent, it does not go to the maximum bidder, the goal here is that the bid includes the value prop
 * and also the intention and contract (if there is one) for distributing subdomains.
 *
 * In particular, the controller + data field is used in conjunction with the DynamicTokenController,
 * to which the data is forwarded, which creates a new dynamic token and converter using the specified
 * reserve token, which would be most commonly in the initial use cases the parent's staking token. amd
 * then then configures sets the controller back to the StakingController.
 *
 * However, one may also use safeSetController with the expected data, or unsafely set this
 * contract as the controller and then call configureDomain for different configurations.
 *
 * This contract also supports staking from any token to the required stake token via bancor's
 * path converter.
 */
contract StakingController is IZNSController, Initializable {
    using SafeERC20 for IERC20;

    address constant ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    enum StakeStatus {NULL, BID, ACCEPTED, STAKED}
    /**
     * @dev Stake
     * @param createHash We forward data to be passed safe controller setting data in our create functions
     * but to save on gas, we don't store the data but only its hash
     * Hash is keccak256(abi.encode(controller, data))
     */
    struct Stake {
        StakeStatus status;
        uint256 parentId;
        uint256 amount;
        bytes32 createHash;
        address stakeToken;
    }

    struct DomainConfig {
        address stakeToken;
        uint256 minBid;
    }

    ZNSRegistry registry;
    IBancorRegistry bancor;
    /// @dev Mapping index here is keccak256(abi.encode(staker, domainId))
    mapping(bytes32 => Stake) stakes;
    mapping(uint256 => DomainConfig) domainConfigs;

    struct BancorSwapData {
        address[] path;
        uint256 amount;
        uint256 minOut;
    }

    struct CreateData {
        bytes controllerData;
        string lockableProperties;
    }

    event StakeTokenSet(
        uint256 indexed id,
        address stakeToken
    );

    event MinBidSet(
        uint256 indexed id,
        uint256 minBid
    );

    event BidAccepted(address staker, uint256 id);

    event BidClaimed(
        address staker,
        address indexed owner,
        uint256 indexed id,
        address indexed controller
    );

    event Bid(
        address indexed staker,
        address indexed controller,
        uint256 indexed parentId,
        string name,
        CreateData createData,
        string proposal,
        uint256 amt
    );

    event Unbid(address staker, uint256 id, uint256 indexed parentId);

    function stakeOf(address staker, uint256 id) external view returns (Stake memory) {
        return stakes[keccak256(abi.encode(staker, id))];
    }

    function configOf(uint256 id) external view returns (DomainConfig memory) {
        return domainConfigs[id];
    }

    function initialize(ZNSRegistry _registry, IBancorRegistry _bancor) public initializer {
        registry = _registry;
        bancor = _bancor;
    }

    function bancorNetwork() public view returns (IBancorNetwork) {
        return IBancorNetwork(bancor.addressOf("BancorNetwork"));
    }

    function acceptBid(
        address staker,
        uint256 id,
        uint256 parentId
    ) external {
        require(registry.ownerOf(parentId) == msg.sender);
        bytes32 stakeHash = keccak256(abi.encode(staker, id));
        Stake storage stake = stakes[stakeHash];
        require(stake.parentId == parentId);
        require(stake.status == StakeStatus.BID);
        stake.status = StakeStatus.ACCEPTED;
        emit BidAccepted(staker, id);
    }

    function claimBid(
        uint256 parentId,
        string calldata name,
        address owner,
        address controller,
        bytes calldata data,
        string calldata lockableProperties
    ) external {
        require(data.length == 0 || Address.isContract(controller));
        uint256 id = registry.createDomainSafeController(parentId, name, address(this), controller, data);
        Stake storage stake =
            stakes[keccak256(abi.encode(msg.sender, id))];
        require(stake.status == StakeStatus.ACCEPTED);
        require(
            stake.createHash == keccak256(abi.encode(controller, data, lockableProperties))
        );
        registry.setLockableProperties(id, lockableProperties);
        registry.transferFrom(address(this), owner, id);
        emit BidClaimed(msg.sender, owner, id, controller);
    }

    function safeClaimBid(
        uint256 parentId,
        string calldata name,
        address owner,
        address controller,
        bytes calldata controllerData,
        string calldata lockableProperties,
        bytes calldata transferData
    ) external {
        require(controllerData.length == 0 || Address.isContract(controller));
        require(transferData.length == 0 || Address.isContract(owner));

        uint256 id = registry.createDomainSafeController(parentId, name, address(this), controller, controllerData);
        Stake storage stake =
            stakes[keccak256(abi.encode(msg.sender, id))];
        require(stake.status == StakeStatus.ACCEPTED);
        require(
            stake.createHash ==
                keccak256(abi.encode(controller, controllerData, lockableProperties))
        );
        registry.setLockableProperties(id, lockableProperties);
        registry.safeTransferFrom(address(this), owner, id, transferData);
        emit BidClaimed(
            msg.sender,
            owner,
            id,
            controller
        );
    }
    /// @notice this swaps tokens prior to staking
    function bidByPath(
        uint256 parentId,
        string calldata name,
        address controller,
        CreateData calldata createData,
        string calldata proposal,
        BancorSwapData calldata swapData
    ) external payable {
        bidForByPath(parentId, name, controller, createData, proposal, swapData, msg.sender);
    }

    function bidForByPath(
        uint256 parentId,
        string calldata name,
        address controller,
        CreateData calldata createData,
        string calldata proposal,
        BancorSwapData calldata swapData,
        address staker
    ) public payable {
        address stakeToken = swapData.path[swapData.path.length - 1];
        uint amt;
        {
            uint256 id = registry.calcId(parentId, name);
            require(!registry.exists(id));
            require(registry.controllerOf(parentId) == address(this));
            DomainConfig storage domainConfig = domainConfigs[parentId];
            require(stakeToken == domainConfig.stakeToken);
            bytes32 stakeHash =
                keccak256(abi.encode(staker, id));
            Stake storage stake = stakes[stakeHash];
            require(stake.status == StakeStatus.NULL);
            stake.status = StakeStatus.BID;
            require(domainConfig.minBid <= swapData.minOut);
            stake.status = StakeStatus.BID;
            stake.stakeToken = stakeToken;
            stake.createHash = keccak256(abi.encode(controller, createData.controllerData, createData.lockableProperties));
            stake.parentId = parentId;
            address firstToken = swapData.path[0];
            if(firstToken == ETH_ADDRESS) {
                require(msg.value == swapData.amount);
                amt = bancorNetwork().convertByPath{value: msg.value}(swapData.path, swapData.amount, swapData.minOut, payable(address(this)), address(0), 0);
            } else {
                require(msg.value == 0);
                uint swapAmt = swapData.amount;
                IERC20(firstToken).safeTransferFrom(msg.sender, address(this), swapAmt);
                IBancorNetwork _bancor = bancorNetwork();
                IERC20(firstToken).approve(address(_bancor), swapAmt);
                amt = _bancor.convertByPath(swapData.path, swapAmt, swapData.minOut, payable(address(0)), address(0), 0);
            }
            require(address(this).balance == 0);
            stake.amount = amt;
       }
       emit Bid(
            staker,
            controller,
            parentId,
            name,
            createData,
            proposal,
            amt
        );
    }

    function bid(
        uint256 parentId,
        string calldata name,
        address controller,
        CreateData calldata createData,
        string calldata proposal,
        uint256 amt
    ) external {
       bidFor(parentId, name, controller, createData, proposal, amt, msg.sender);
    }

    function bidFor(
        uint256 parentId,
        string calldata name,
        address controller,
        CreateData calldata createData,
        string calldata proposal,
        uint256 amt,
        address staker
    ) public {
        require(createData.controllerData.length == 0 || Address.isContract(controller));
        address stakeToken;
        {
            uint256 id = registry.calcId(parentId, name);
            require(!registry.exists(id));
            require(registry.controllerOf(parentId) == address(this));
            DomainConfig storage domainConfig = domainConfigs[parentId];
            stakeToken = domainConfig.stakeToken;
            require(domainConfig.minBid <= amt);
            bytes32 stakeHash =
                keccak256(abi.encode(staker, id));
            Stake storage stake = stakes[stakeHash];
            require(stake.status == StakeStatus.NULL);
            stake.status = StakeStatus.BID;
            stake.amount = amt;
            stake.stakeToken = stakeToken;
            stake.createHash = keccak256(abi.encode(controller, createData.controllerData, createData.lockableProperties));
            stake.parentId = parentId;
            IERC20(stakeToken).safeTransferFrom(staker, address(this), amt);
        }
        emit Bid(
            staker,
            controller,
            parentId,
            name,
            createData,
            proposal,
            amt
        );
    }

    function unbid(uint256 id, uint256 parentId) external {
        bytes32 stakeHash =
            keccak256(abi.encode(msg.sender, id));
        Stake storage stake = stakes[stakeHash];
        require(
            stake.status == StakeStatus.BID ||
                stake.status == StakeStatus.ACCEPTED
        );
        uint256 amt = stake.amount;
        delete stakes[stakeHash];
        IERC20(stake.stakeToken).safeTransferFrom(
            address(this),
            msg.sender,
            amt
        );
        emit Unbid(msg.sender, id, parentId);
    }

    function onSetZnsController(
        address sender,
        address oldController,
        uint256 id,
        bytes memory data
    ) external override returns (bytes4) {
        require(msg.sender == address(registry));
        (address stakeToken, uint256 minBid) =
            abi.decode(data, (address, uint256));
        DomainConfig storage domainConfig = domainConfigs[id];
        _configureDomain(domainConfig, id, stakeToken, minBid);
        return this.onSetZnsController.selector;
    }

    function _setMinBid(
        DomainConfig storage domainConfig,
        uint256 id,
        uint256 minBid
    ) internal {
        domainConfig.minBid = minBid;
        emit MinBidSet(id, minBid);
    }

    function setMinBid(uint256 id, uint256 minBid) external {
        require(registry.ownerOf(id) == msg.sender);
        _setMinBid(domainConfigs[id], id, minBid);
    }

    function _configureDomain(DomainConfig storage domainConfig, uint256 id, address stakeToken, uint256 minBid) internal {
        domainConfig.stakeToken = stakeToken;
        emit StakeTokenSet(id, stakeToken);
        _setMinBid(domainConfig, id, minBid);
    }

    /// @notice For flows that unsafely set this contract as the controller
    function configureDomain(
        uint256 id,
        address stakeToken,
        uint256 minBid
    ) external {
        require(registry.controllerOf(id) == address(this));
        require(registry.ownerOf(id) == msg.sender);
        DomainConfig storage domainConfig = domainConfigs[id];
        /// @dev can only be set once
        require(domainConfig.stakeToken == address(0));
        _configureDomain(domainConfig, id, stakeToken, minBid);
    }
}
