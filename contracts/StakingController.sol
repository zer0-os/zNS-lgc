pragma solidity ^0.7.6;

pragma abicoder v2;


import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./Registry.sol";
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
    ) external returns (uint256);
}

contract StakingController is IZNSController, Initializable {
    using SafeERC20 for IERC20;

    enum StakeStatus {NULL, BID, ACCEPTED, STAKED}

    struct Stake {
        StakeStatus status;
        uint256 parentId;
        uint256 amount;
        bytes32 createHash;
        address stakeToken;
    }

    struct DomainState {
        address stakeToken;
        uint256 minBid;
    }

    Registry registry;
    IBancorRegistry bancor;
    mapping(bytes32 => Stake) stakes;
    mapping(uint256 => DomainState) domainStates;

    event DomainConfigured(
        uint256 indexed parentId,
        address stakeToken,
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
        string domain,
        address stakeToken,
        bytes data,
        string proposal,
        uint256 amt
    );
    event Unbid(address staker, uint256 id, uint256 indexed parentId);

    function stakeOf(address staker, uint256 id) external view returns (Stake memory) {
        return stakes[keccak256(abi.encodePacked(staker, id))];
    }

    function stateOf(uint256 id) external view returns (DomainState memory) {
        return domainStates[id];
    }

    function initialize(Registry _registry, IBancorRegistry _bancor) public initializer {
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
        bytes32 stakeHash = keccak256(abi.encodePacked(staker, id));
        Stake storage stake = stakes[stakeHash];
        require(stake.parentId == parentId);
        require(stake.status == StakeStatus.BID);
        stake.status = StakeStatus.ACCEPTED;
        emit BidAccepted(staker, id);
    }

    function claimBid(
        string calldata domain,
        address owner,
        address controller,
        bytes calldata data
    ) external {
        require(data.length == 0 || Address.isContract(controller));
        (uint256 id, ) = registry.createDomainSafeController(domain, owner, controller, data);
        Stake storage stake =
            stakes[keccak256(abi.encodePacked(msg.sender, id))];
        require(stake.status == StakeStatus.ACCEPTED);
        require(
            stake.createHash == keccak256(abi.encodePacked(controller, data))
        );
        emit BidClaimed(msg.sender, owner, id, controller);
    }

    function safeClaimBid(
        string calldata domain,
        address owner,
        address controller,
        bytes calldata controllerData,
        bytes calldata mintData
    ) external {
        require(controllerData.length == 0 || Address.isContract(controller));
        require(mintData.length == 0 || Address.isContract(owner));
        (uint256 id, ) = registry.safeCreateDomain(
            domain,
            owner,
            controller,
            mintData,
            controllerData
        );
        Stake storage stake =
            stakes[keccak256(abi.encodePacked(msg.sender, id))];
        require(stake.status == StakeStatus.ACCEPTED);
        require(
            stake.createHash ==
                keccak256(abi.encodePacked(controller, controllerData))
        );

        emit BidClaimed(
            msg.sender,
            owner,
            id,
            controller
        );
    }

    function bidByPath(
        address[] memory _path,
        uint256 _amount,
        uint256 _minReturn,
        string calldata domain,
        address controller,
        bytes calldata data,
        string calldata proposal,
        address staker
    ) external {
        bidForByPath(_path, _amount, _minReturn, domain, controller, data, proposal, msg.sender);
    }

    function bidForByPath(
        address[] memory _path,
        uint256 _amount,
        uint256 _minReturn,
        string calldata domain,
        address controller,
        bytes calldata data,
        string calldata proposal,
        address staker
    ) public {
        address stakeToken = _path[_path.length -1];
        uint256 amt = bancorNetwork().convertByPath(_path, _amount, _minReturn, payable(address(this)), address(0), 0);
        {
            (uint256 id, uint256 parentId) = registry.getIdAndParent(domain);
            require(!registry.exists(id));
            require(registry.controllerOf(parentId) == address(this));
            DomainState storage domainState = domainStates[parentId];
            require(stakeToken == domainState.stakeToken);
            bytes32 stakeHash =
                keccak256(abi.encodePacked(staker, id));
            Stake storage stake = stakes[stakeHash];
            require(stake.status == StakeStatus.NULL);
            stake.status = StakeStatus.BID;
            require(domainState.minBid <= amt);
            stake.amount = amt;
            stake.status = StakeStatus.BID;
            stake.stakeToken = stakeToken;
            stake.createHash = keccak256(abi.encodePacked(controller, data));
            stake.parentId = parentId;
       }
       emit Bid(
            staker,
            controller,
            domain,
            stakeToken,
            data,
            proposal,
            amt
        );
    }

    function bid(
        string calldata domain,
        address controller,
        bytes calldata data,
        string calldata proposal,
        uint256 amt
    ) external {
       bidFor(domain, controller, data, proposal, amt, msg.sender);
    }

    function bidFor(
        string calldata domain,
        address controller,
        bytes calldata data,
        string calldata proposal,
        uint256 amt,
        address staker
    ) public {
        require(data.length == 0 || Address.isContract(controller));
        address stakeToken;
        {
            (uint256 id, uint256 parentId) = registry.getIdAndParent(domain);
            require(!registry.exists(id));
            require(registry.controllerOf(parentId) == address(this));
            DomainState storage domainState = domainStates[parentId];
            stakeToken = domainState.stakeToken;
            require(domainState.minBid <= amt);
            bytes32 stakeHash =
                keccak256(abi.encodePacked(staker, id));
            Stake storage stake = stakes[stakeHash];
            require(stake.status == StakeStatus.NULL);
            stake.status = StakeStatus.BID;
            stake.amount = amt;
            stake.stakeToken = stakeToken;
            stake.createHash = keccak256(abi.encodePacked(controller, data));
            stake.parentId = parentId;
            IERC20(stakeToken).safeTransferFrom(staker, address(this), amt);
        }
        emit Bid(
            staker,
            controller,
            domain,
            stakeToken,
            data,
            proposal,
            amt
        );
    }

    function unbid(uint256 id, uint256 parentId) external {
        bytes32 stakeHash =
            keccak256(abi.encodePacked(msg.sender, id));
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

    function _configureDomain(
        DomainState storage domainState,
        uint256 id,
        address stakeToken,
        uint256 minBid
    ) internal {
        domainState.stakeToken = stakeToken;
        domainState.minBid = minBid;
        emit DomainConfigured(id, stakeToken, minBid);
    }

    function onSetZnsController(
        address sender,
        address oldController,
        uint256 id,
        bytes memory data
    ) external override returns (bytes4) {
        //uint256 parent = registry.parentOf(id);
        (address stakeToken, uint256 minBid) =
            abi.decode(data, (address, uint256));
        DomainState storage domainState = domainStates[id];
        _configureDomain(domainState, id, stakeToken, minBid);
        return this.onSetZnsController.selector;
    }

    function configureDomain(
        uint256 id,
        address stakeToken,
        uint256 minBid
    ) external {
        DomainState storage domainState = domainStates[id];
        require(domainState.stakeToken == address(0)); // can only be set once
        require(registry.ownerOf(id) == msg.sender);
        _configureDomain(domainState, id, stakeToken, minBid);
    }
}
