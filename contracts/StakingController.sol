//pragma solidity ^0.7.6;
//
//import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
//import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
//import "./Registry.sol";
//
//contract NameAuction is AbstractLimitingController {
//    using SafeERC20 for IERC20;
//
//    enum AuctionStatus {
//        NULL,
//        OPEN,
//        STAKED
//    }
//
//    struct Auction {
//        AuctionStatus status;
//        uint parentId;
//        uint biddingStarts; // relative to year
//        uint biddingEnds;
//        uint acceptingEnds;
//    }
//
//    struct Stake {
//        uint256 id;
//        uint256 amount;
//        bytes256 auction;
//        uint256 timestamp;
//        address stakeToken;
//    }
//
//    struct DomainState {
//        address stakeToken;
//        uint256 minBid;
//        uint256 auctionCount;
//        uint256 auctionsActive;
//        bool onlyTarget;
//    }
//
//    struct Store {
//        Registry registry;
//        // keccak256(abi.encodePacked(parentId, auctionId))
//        mapping (bytes32 => Auction) auctions;
//        mapping (uint256 => Stake) stakes;
//        mapping (bytes32 => uint256) bids;
//        mapping (uint256 => DomainState) domainStates;
//    }
//
//    function store() internal view returns (DStore storage store) {
//        bytes32 slot = keccak256("zns.LimitingRegistrar");
//        assembly {store.slot := slot}
//    }
//
//    function acceptBid(uint256 parentId, uint256 auctionId, address bidder, string domain) onlyTokenOwnerOrTarget(parentId) external view {
//        bytes32 auctionHash = keccak256(abi.encodePacked(parentId, auctionId))
//        bytes32 bidHash = keccak256(abi.encode(msg.sender, auctionHash, parentId, domain));
//        Auction storage auction = auctions[auctionHash];
//        require(auction.status == AuctionStatus.OPEN);
//        require(now < auction.acceptingEnds);
//        auction.status = STAKED;
//    }
//
//    function stake_and_create(
//        uint256 id,
//        uint256 amount,
//        bytes256 auction,
//        uint256 timestamp
//        ) internal {
//
//    }
//
//    function bid(uint256 parentId, uint256 auctionId, string domain, string proposal, uint256 amt) public {
//        Store storage st = store();
//        require(st.registry.canCreate(parentId, address(this)));
//        DomainState storage domainState = st.domainStates[parentId];
//        bytes32 auctionHash = keccak256(abi.encodePacked(parentId, auctionId))
//        Auction storage auction = st.auctions[auctionHash];
//        require(auction.status != AuctionStatus.NULL);
//        require(auction.parentId == parentId);
//        uint256 ny = (now / 1 years) * 1 years;
//        require(ny + auction.biddingStarts < now && now < ny + auction.biddingEnds);
//        require(action.minBid <= amt);
//        // I think encodepacked would cause preimage attacks
//        // because lengths would not be encoded for the strings
//        st.bids[keccak256(abi.encode(msg.sender, actionHash, parentId, domain))] = amt;
//        IERC20(auctions.stakeToken).safeTransferFrom(msg.sender, address(this), amt);
//    }
//
//    function unbid(uint32 auctionId, uint256 parentId, string domain) public {
//        Store storage st = store();
//        Auction storage auction = st.auctions[parentId];
//        require(auction.status != STAKED);
//        bytes32 bidHash = keccak256(abi.encode(msg.sender, auctionHash, parentId, domain));
//        uint256 amt = st.bids[bidHash];
//        delete st.bids[keccak256(abi.encode(msg.sender, auctionHash, parentId, domain))];
//        IERC20(auctions.stakeToken).safeTransferFrom(address(this), msg.sender, amt);
//    }
//
//    modifier onlyTokenOwnerOrTarget (uint256 tokenId) {
//        require(msg.sender == registry.ownerOf(tokenId) || msg.sender == registry.targetOf(tokenId));
//        _;
//    }
//
//    function configureDomain(uint256 parentId, address stakingToken, address minBid) onlyTokenOwnerOrTarget(parentId) {
//        Store storage st = store();
//        Auction storage auction = st.auctions[keccak256(abi.encodePacked(parentId, newId))];
//        DomainState storage domainState = st.domainStates[parentId];
//        domainState.parentId = parentId;
//        domainState.stakingToken = stakingToken;
//    }
//
//    function createAuction(uint256 parentId, uint256 biddingStarts, uint256 biddingEnds, uint256 minBid) onlyTokenOwnerOrTarget(parentId) public {
//        uint256 ny = (now / 1 years) * 1 years;
//        require(now <= ny + biddingStarts && biddingStarts < biddingEnds && biddingEnds < acceptingEnds);
//        Store storage st = store();
//        DomainState storage domainState = st.domainStates[parentId];
//        uint256 newCount = st.auctionCount[parentId] + 1;
//        bytes32 auctionHash = keccak256(abi.encodePacked(parentId, newCount))
//        Auction storage auction = st.auctions[auctionHash];
//        require(auction.status != AuctionStatus.NULL)
//        domainState.auctionCount = newCount;
//        domainState.auctionsActive++;
//        auction.parentId = parentId;
//        auction.biddingStarts = biddingStarts;
//        auction.biddingEnds = biddingEnds;
//        auction.stakingToken = domainState.stakingToken;
//    }
//    // address public stakeToken;
//
//
//    // mapping(bytes32=>uint) public bids;
//    // mapping(string=>Auction) auctions;
//    // mapping(string=>address) labels;
//
//    // event BidPlaced(address indexed bidder, uint amount, bytes32 hash);
//    // event BidRevealed(address indexed bidder, bytes32 indexed labelHash, string label, uint amount);
//    // event AuctionFinalised(address indexed winner, bytes32 indexed labelHash, string label, uint amount);
//
//
//    // function finaliseAuction(string label) external {
//    //     require(now >= revealEnds);
//
//    //     Auction storage auction = auctions[label];
//    //     require(auction.winner != 0);
//
//    //     uint winPrice = auction.secondBid;
//    //     if(winPrice == 0) {
//    //         winPrice = MIN_BID;
//    //     }
//    //     if(winPrice < auction.maxBid) {
//    //         // Ignore failed sends
//    //         IERC20(stakeToken).safeTransferFrom(address(this), auction.winner, auction.maxBid - winPrice);
//    //         auction.winner.send(auction.maxBid - winPrice);
//    //     }
//    //     fundsAvailable += winPrice;
//
//    //     emit AuctionFinalised(auction.winner, keccak256(abi.encodePacked(label)), label, winPrice);
//
//    //     labels[label] = auction.winner;
//    //     delete auctions[label];
//    // }
//
//
//    // function auction(string name) external view returns(uint maxBid, uint secondBid, address winner) {
//    //     Auction storage a = auctions[name];
//    //     return (a.maxBid, a.secondBid, a.winner);
//    // }
//
//    // function labelOwner(string name) external view returns(address) {
//    //     return labels[name];
//    // }
//
//    // function computeBidHash(address bidder, string name, bytes32 secret) public pure returns(bytes32) {
//    //     return keccak256(abi.encodePacked(bidder, name, secret));
//    // }
//
//    // /**
//    //  * @dev Returns the length of a given string
//    //  *
//    //  * @param s The string to measure the length of
//    //  * @return The length of the input string
//    //  */
//    // function strlen(string s) internal pure returns (uint) {
//    //     s; // Don't warn about unused variables
//    //     // Starting here means the LSB will be the byte we care about
//    //     uint ptr;
//    //     uint end;
//    //     assembly {
//    //         ptr := add(s, 1)
//    //         end := add(mload(s), ptr)
//    //     }
//    //     for (uint len = 0; ptr < end; len++) {
//    //         uint8 b;
//    //         assembly { b := and(mload(ptr), 0xFF) }
//    //         if (b < 0x80) {
//    //             ptr += 1;
//    //         } else if (b < 0xE0) {
//    //             ptr += 2;
//    //         } else if (b < 0xF0) {
//    //             ptr += 3;
//    //         } else if (b < 0xF8) {
//    //             ptr += 4;
//    //         } else if (b < 0xFC) {
//    //             ptr += 5;
//    //         } else {
//    //             ptr += 6;
//    //         }
//    //     }
//    //     return len;
//    // }
//}
