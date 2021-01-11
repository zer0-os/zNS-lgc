pragma solidity ^0.7.6;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IRegistrar.sol";

contract NameAuction {
    using SafeERC20 for IERC20;
    struct Auction {
        uint maxBid;
        uint secondBid;
        address winner;
        uint biddingStarts;
        uint biddingEnds;
        uint revealEnds;
        uint MIN_BID;
        address stakeToken;
    }

    struct Stake {
        uint256 id;
        uint256 amount;
        uint256 timestamp;
    }

    struct Store {
        mapping (uint256 => Auction) auctions;
        mapping (uint256 => Stake) stakes;
    }

    function store() internal view returns (DStore storage store) {
        bytes32 slot = keccak256("zns.LimitingRegistrar");
        assembly {store.slot := slot}
    }

    // address public stakeToken;


    // mapping(bytes32=>uint) public bids;
    // mapping(string=>Auction) auctions;
    // mapping(string=>address) labels;

    // event BidPlaced(address indexed bidder, uint amount, bytes32 hash);
    // event BidRevealed(address indexed bidder, bytes32 indexed labelHash, string label, uint amount);
    // event AuctionFinalised(address indexed winner, bytes32 indexed labelHash, string label, uint amount);

    constructor(
    ) public {
        owner = msg.sender;
    }

    function placeBid(bytes32 bidHash, uint amount) external payable {
        Store store = store();
        require(now >= biddingStarts && now < biddingEnds);

        require(msg.value >= MIN_BID);
        require(bids[bidHash] == 0);
        bids[bidHash] = amount;
        IERC20(stakeToken).safeTransferFrom(msg.sender, address(this), amount);
        emit BidPlaced(msg.sender, amount, bidHash);
    }

    function revealBid(address bidder, uint256 id, bytes32 secret) external {
        require(now >= biddingEnds && now < revealEnds);

        bytes32 bidHash = computeBidHash(bidder, id, secret);
        uint bidAmount = bids[bidHash];
        bids[bidHash] = 0;
        require(bidAmount > 0);

        emit BidRevealed(bidder, keccak256(abi.encodePacked(id)), id, bidAmount);

        Auction storage a = auctions[id];
        if(bidAmount > a.maxBid) {
            // New winner!
            if(a.winner != 0) {
                // Ignore failed sends - bad luck for them.
                // a.winner.send(a.maxBid);
                IERC20(stakeToken).safeTransferFrom(address(this), a.winner, a.maxBid);
            }
            a.secondBid = a.maxBid;
            a.maxBid = bidAmount;
            a.winner = bidder;
        } else if(bidAmount > a.secondBid) {
            // New second bidder
            a.secondBid = bidAmount;
            IERC20(stakeToken).safeTransferFrom(address(this), bidder, bidAmount);
        } else {
            // No effect on the auction
            IERC20(stakeToken).safeTransferFrom(address(this), bidder, bidAmount);
        }
    }

    // function finaliseAuction(string label) external {
    //     require(now >= revealEnds);

    //     Auction storage auction = auctions[label];
    //     require(auction.winner != 0);

    //     uint winPrice = auction.secondBid;
    //     if(winPrice == 0) {
    //         winPrice = MIN_BID;
    //     }
    //     if(winPrice < auction.maxBid) {
    //         // Ignore failed sends
    //         IERC20(stakeToken).safeTransferFrom(address(this), auction.winner, auction.maxBid - winPrice);
    //         auction.winner.send(auction.maxBid - winPrice);
    //     }
    //     fundsAvailable += winPrice;

    //     emit AuctionFinalised(auction.winner, keccak256(abi.encodePacked(label)), label, winPrice);

    //     labels[label] = auction.winner;
    //     delete auctions[label];
    // }


    // function auction(string name) external view returns(uint maxBid, uint secondBid, address winner) {
    //     Auction storage a = auctions[name];
    //     return (a.maxBid, a.secondBid, a.winner);
    // }

    // function labelOwner(string name) external view returns(address) {
    //     return labels[name];
    // }

    // function computeBidHash(address bidder, string name, bytes32 secret) public pure returns(bytes32) {
    //     return keccak256(abi.encodePacked(bidder, name, secret));
    // }

    // /**
    //  * @dev Returns the length of a given string
    //  *
    //  * @param s The string to measure the length of
    //  * @return The length of the input string
    //  */
    // function strlen(string s) internal pure returns (uint) {
    //     s; // Don't warn about unused variables
    //     // Starting here means the LSB will be the byte we care about
    //     uint ptr;
    //     uint end;
    //     assembly {
    //         ptr := add(s, 1)
    //         end := add(mload(s), ptr)
    //     }
    //     for (uint len = 0; ptr < end; len++) {
    //         uint8 b;
    //         assembly { b := and(mload(ptr), 0xFF) }
    //         if (b < 0x80) {
    //             ptr += 1;
    //         } else if (b < 0xE0) {
    //             ptr += 2;
    //         } else if (b < 0xF0) {
    //             ptr += 3;
    //         } else if (b < 0xF8) {
    //             ptr += 4;
    //         } else if (b < 0xFC) {
    //             ptr += 5;
    //         } else {
    //             ptr += 6;
    //         }
    //     }
    //     return len;
    // }
}