// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PrizePool
 * @dev Smart contract for managing prize pools with multi-currency support
 */
contract PrizePool is ReentrancyGuard, Ownable {
    // Asset type enumeration
    enum AssetType {
        Native,  // ETH, SOL, etc.
        ERC20,   // ERC20 tokens
        ERC721   // NFTs
    }

    // Prize distribution structure
    struct PrizeDistribution {
        uint256 rank;        // 1 = 1st place, 2 = 2nd place, etc.
        uint256 percentage;  // Percentage of total pool (e.g., 50 for 50%)
        AssetType assetType; // Which asset type to distribute
    }

    // Deposit structure
    struct Deposit {
        address sponsor;
        AssetType assetType;
        address tokenAddress; // ERC20/ERC721 address, or address(0) for native
        uint256 tokenId;     // NFT token ID (if ERC721)
        uint256 amount;       // Amount deposited
        bool distributed;     // Whether prize has been distributed
    }

    uint256 public eventId;
    address public eventContract; // Address of EventManagement contract
    uint256 public lockedUntil;   // Locked until this timestamp
    bool public distributed;      // Whether prizes have been distributed

    // Mapping from deposit ID to deposit
    mapping(uint256 => Deposit) public deposits;
    uint256 public depositCounter;

    // Prize distribution configuration
    PrizeDistribution[] public prizeDistributions;

    // Total amounts by asset type
    mapping(AssetType => uint256) public totalAmounts;
    mapping(AssetType => mapping(address => uint256)) public tokenAmounts; // For ERC20/ERC721

    // Events
    event Deposited(
        uint256 indexed depositId,
        address indexed sponsor,
        AssetType assetType,
        address tokenAddress,
        uint256 amount,
        uint256 tokenId
    );

    event PrizeDistributed(
        uint256 indexed rank,
        address indexed recipient,
        AssetType assetType,
        address tokenAddress,
        uint256 amount,
        uint256 tokenId
    );

    event DistributionCompleted();

    modifier onlyEventContract() {
        require(msg.sender == eventContract, "Only event contract can call");
        _;
    }

    modifier notLocked() {
        require(block.timestamp < lockedUntil || lockedUntil == 0, "Pool is locked");
        _;
    }

    modifier onlyWhenLocked() {
        require(block.timestamp >= lockedUntil && lockedUntil > 0, "Pool is not locked yet");
        _;
    }

    /**
     * @dev Constructor
     * @param _eventId Event ID
     * @param _eventContract Address of EventManagement contract
     */
    constructor(uint256 _eventId, address _eventContract) {
        eventId = _eventId;
        eventContract = _eventContract;
    }

    /**
     * @dev Deposit native assets (ETH, etc.)
     */
    function depositNative() public payable nonReentrant notLocked {
        require(msg.value > 0, "Amount must be greater than 0");

        depositCounter++;
        deposits[depositCounter] = Deposit({
            sponsor: msg.sender,
            assetType: AssetType.Native,
            tokenAddress: address(0),
            tokenId: 0,
            amount: msg.value,
            distributed: false
        });

        totalAmounts[AssetType.Native] += msg.value;

        emit Deposited(depositCounter, msg.sender, AssetType.Native, address(0), msg.value, 0);
    }

    /**
     * @dev Deposit ERC20 tokens
     * @param tokenAddress ERC20 token address
     * @param amount Amount to deposit
     */
    function depositERC20(address tokenAddress, uint256 amount) public nonReentrant notLocked {
        require(tokenAddress != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");

        IERC20 token = IERC20(tokenAddress);
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        depositCounter++;
        deposits[depositCounter] = Deposit({
            sponsor: msg.sender,
            assetType: AssetType.ERC20,
            tokenAddress: tokenAddress,
            tokenId: 0,
            amount: amount,
            distributed: false
        });

        totalAmounts[AssetType.ERC20] += amount;
        tokenAmounts[AssetType.ERC20][tokenAddress] += amount;

        emit Deposited(depositCounter, msg.sender, AssetType.ERC20, tokenAddress, amount, 0);
    }

    /**
     * @dev Deposit ERC721 NFT
     * @param tokenAddress ERC721 contract address
     * @param tokenId NFT token ID
     */
    function depositERC721(address tokenAddress, uint256 tokenId) public nonReentrant notLocked {
        require(tokenAddress != address(0), "Invalid token address");

        IERC721 nft = IERC721(tokenAddress);
        require(nft.ownerOf(tokenId) == msg.sender, "Not the owner");
        nft.transferFrom(msg.sender, address(this), tokenId);

        depositCounter++;
        deposits[depositCounter] = Deposit({
            sponsor: msg.sender,
            assetType: AssetType.ERC721,
            tokenAddress: tokenAddress,
            tokenId: tokenId,
            amount: 1, // NFTs are counted as 1
            distributed: false
        });

        totalAmounts[AssetType.ERC721] += 1;
        tokenAmounts[AssetType.ERC721][tokenAddress] += 1;

        emit Deposited(depositCounter, msg.sender, AssetType.ERC721, tokenAddress, 1, tokenId);
    }

    /**
     * @dev Set prize distribution configuration (only owner/organizer)
     * @param distributions Array of prize distributions
     */
    function setPrizeDistributions(PrizeDistribution[] memory distributions) public onlyOwner {
        delete prizeDistributions;
        uint256 totalPercentage = 0;
        
        for (uint256 i = 0; i < distributions.length; i++) {
            require(distributions[i].percentage > 0, "Percentage must be greater than 0");
            totalPercentage += distributions[i].percentage;
            prizeDistributions.push(distributions[i]);
        }
        
        require(totalPercentage <= 100, "Total percentage cannot exceed 100%");
    }

    /**
     * @dev Set lock time (only event contract)
     * @param _lockedUntil Timestamp until which pool is locked
     */
    function setLockedUntil(uint256 _lockedUntil) public onlyEventContract {
        lockedUntil = _lockedUntil;
    }

    /**
     * @dev Distribute prizes to winners (only owner/organizer, after lock period)
     * @param winners Array of winner addresses (index corresponds to rank - 1)
     * @param assetType Asset type to distribute
     * @param tokenAddress Token address (if ERC20/ERC721)
     */
    function distributePrizes(
        address[] memory winners,
        AssetType assetType,
        address tokenAddress
    ) public onlyOwner onlyWhenLocked nonReentrant {
        require(!distributed, "Prizes already distributed");
        require(winners.length > 0, "No winners provided");

        uint256 totalToDistribute = 0;
        if (assetType == AssetType.Native) {
            totalToDistribute = totalAmounts[AssetType.Native];
        } else if (assetType == AssetType.ERC20) {
            totalToDistribute = tokenAmounts[AssetType.ERC20][tokenAddress];
        } else if (assetType == AssetType.ERC721) {
            totalToDistribute = tokenAmounts[AssetType.ERC721][tokenAddress];
        }

        require(totalToDistribute > 0, "No funds available for this asset type");

        // Distribute according to prize distribution configuration
        for (uint256 i = 0; i < prizeDistributions.length && i < winners.length; i++) {
            if (prizeDistributions[i].assetType != assetType) {
                continue;
            }

            uint256 rank = prizeDistributions[i].rank;
            if (rank > winners.length) {
                continue;
            }

            address winner = winners[rank - 1];
            if (winner == address(0)) {
                continue;
            }

            uint256 amount = (totalToDistribute * prizeDistributions[i].percentage) / 100;

            if (assetType == AssetType.Native) {
                (bool success, ) = winner.call{value: amount}("");
                require(success, "Transfer failed");
            } else if (assetType == AssetType.ERC20) {
                IERC20 token = IERC20(tokenAddress);
                require(token.transfer(winner, amount), "Token transfer failed");
            } else if (assetType == AssetType.ERC721) {
                // For NFTs, distribute one NFT per rank (simplified)
                // In practice, you might want a more complex distribution logic
                IERC721 nft = IERC721(tokenAddress);
                // Find an available NFT and transfer it
                // This is simplified - you'd need to track which NFTs are available
            }

            emit PrizeDistributed(rank, winner, assetType, tokenAddress, amount, 0);
        }

        distributed = true;
        emit DistributionCompleted();
    }

    /**
     * @dev Get total amount for an asset type
     * @param assetType Asset type
     */
    function getTotalAmount(AssetType assetType) public view returns (uint256) {
        return totalAmounts[assetType];
    }

    /**
     * @dev Get token amount for a specific token address
     * @param assetType Asset type
     * @param tokenAddress Token address
     */
    function getTokenAmount(AssetType assetType, address tokenAddress) public view returns (uint256) {
        return tokenAmounts[assetType][tokenAddress];
    }

    /**
     * @dev Get deposit information
     * @param depositId Deposit ID
     */
    function getDeposit(uint256 depositId) public view returns (Deposit memory) {
        return deposits[depositId];
    }

    /**
     * @dev Get prize distribution count
     */
    function getPrizeDistributionCount() public view returns (uint256) {
        return prizeDistributions.length;
    }

    /**
     * @dev Emergency withdraw (only owner, before lock)
     */
    function emergencyWithdraw() public onlyOwner notLocked {
        require(address(this).balance > 0, "No funds to withdraw");
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }
}

