pragma solidity ^0.7.6;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./Registry.sol";

contract StakingController {
    using SafeERC20 for IERC20;

    enum StakeStatus {NULL, BID, ACCEPTED, STAKED}

    struct Stake {
        StakeStatus status;
        uint256 amount;
        bytes32 createHash;
        address stakeToken;
    }

    struct DomainState {
        address stakeToken;
        uint256 minBid;
    }

    Registry registry;
    mapping(bytes32 => Stake) stakes;
    mapping(uint256 => DomainState) domainStates;

    event DomainConfigured(
        uint256 indexed parentId,
        address stakeToken,
        uint256 minBid
    );
    event BidAccepted(address staker, uint256 id, uint256 indexed parentId);
    event BidClaimed(
        address staker,
        address indexed owner,
        uint256 indexed parentId,
        string domain,
        address indexed controller,
        bytes data
    );
    event Bid(
        address indexed staker,
        string domain,
        uint256 indexed parentId,
        address indexed controller,
        address stakeToken,
        bytes data,
        string proposal,
        uint256 amt
    );
    event Unbid(address staker, uint256 id, uint256 indexed parentId);

    function acceptBid(
        address staker,
        uint256 id,
        uint256 parentId
    ) external {
        require(registry.ownerOf(parentId) == msg.sender);
        bytes32 stakeHash = keccak256(abi.encodePacked(staker, id, parentId));
        Stake storage stake = stakes[stakeHash];
        require(stake.status == StakeStatus.BID);
        stake.status = StakeStatus.ACCEPTED;
        emit BidAccepted(staker, id, parentId);
    }

    function claimBid(
        string calldata domain,
        address owner,
        address controller,
        bytes calldata data
    ) external {
        require(data.length == 0 || Address.isContract(controller));
        (uint256 id, uint256 parentId) = registry.getIdAndParent(domain);
        Stake storage stake =
            stakes[keccak256(abi.encodePacked(msg.sender, id, parentId))];
        require(stake.status == StakeStatus.ACCEPTED);
        require(
            stake.createHash == keccak256(abi.encodePacked(controller, data))
        );
        registry.createDomainSafeController(domain, owner, controller, data);
        emit BidClaimed(msg.sender, owner, parentId, domain, controller, data);
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
        (uint256 id, uint256 parentId) = registry.getIdAndParent(domain);
        Stake storage stake =
            stakes[keccak256(abi.encodePacked(msg.sender, id, parentId))];
        require(stake.status == StakeStatus.ACCEPTED);
        require(
            stake.createHash ==
                keccak256(abi.encodePacked(controller, controllerData))
        );
        registry.safeCreateDomain(
            domain,
            owner,
            controller,
            mintData,
            controllerData
        );
        emit BidClaimed(
            msg.sender,
            owner,
            parentId,
            domain,
            controller,
            controllerData
        );
    }

    function bid(
        string calldata domain,
        address controller,
        bytes calldata data,
        string calldata proposal,
        uint256 amt
    ) external {
        require(data.length == 0 || Address.isContract(controller));
        address stakeToken;
        uint256 parentId;
        {
            uint256 id;
            (id, parentId) = registry.getIdAndParent(domain);
            require(!registry.exists(id));
            require(registry.controllerOf(parentId) == address(this));
            DomainState storage domainState = domainStates[parentId];
            stakeToken = domainState.stakeToken;
            require(domainState.minBid <= amt);
            bytes32 stakeHash =
                keccak256(abi.encodePacked(msg.sender, id, parentId));
            Stake storage stake = stakes[stakeHash];
            require(stake.status == StakeStatus.NULL);
            stake.status = StakeStatus.BID;
            stake.amount = amt;
            stake.stakeToken = stakeToken;
            stake.createHash = keccak256(abi.encodePacked(controller, data));
            IERC20(stakeToken).safeTransferFrom(msg.sender, address(this), amt);
        }
        emit Bid(
            msg.sender,
            domain,
            parentId,
            controller,
            stakeToken,
            data,
            proposal,
            amt
        );
    }

    function unbid(uint256 id, uint256 parentId) external {
        bytes32 stakeHash =
            keccak256(abi.encodePacked(msg.sender, id, parentId));
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

    function configureDomain(
        uint256 parentId,
        address stakeToken,
        uint256 minBid
    ) external {
        require(registry.ownerOf(parentId) == msg.sender);
        require(registry.controllerOf(parentId) == address(this));
        DomainState storage domainState = domainStates[parentId];
        domainState.stakeToken = stakeToken;
        domainState.minBid = minBid;
        emit DomainConfigured(parentId, stakeToken, minBid);
    }
}
