// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interface for interacting with an ERC20 token (used for staking)
interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

// Main staking contract
contract SimpleStaking {
    IERC20 public token; // Token used for staking
    address public owner; // Owner of the staking contract
    uint256 public rewardRate = 10; // Reward rate (10% per 30 days)

    // Struct to store each user's stake details
    struct Stake {
        uint256 amount; // Amount of tokens staked
        uint256 timestamp; // Time when staking was done
    }

    // Mapping to store stake information for each user
    mapping(address => Stake) public stakes;

    // Constructor to set the token address and contract owner
    constructor(IERC20 _token) {
        token = _token; // Set the token to be used
        owner = msg.sender; // Set the owner as the address that deployed the contract
    }

    // Function for users to stake tokens
    function stake(uint256 _amount) external {
        require(_amount > 0, "Amount must be > 0"); // User must stake a positive amount
        require(stakes[msg.sender].amount == 0, "Already staked"); // User can stake only once in this version

        // Transfer tokens from the user's wallet to this contract
        token.transferFrom(msg.sender, address(this), _amount);

        // Save the staked amount and the timestamp
        stakes[msg.sender] = Stake(_amount, block.timestamp);
    }

    // Function to calculate rewards for a specific user
    function calculateReward(address _user) public view returns (uint256) {
        Stake memory userStake = stakes[_user];

        // If user hasn't staked anything, reward is 0
        if (userStake.amount == 0) return 0;

        // Calculate how long the user has staked (in seconds)
        uint256 stakingTime = block.timestamp - userStake.timestamp;

        // Calculate reward: (amount * rewardRate * time) / (100 * 30 days)
        uint256 reward = (userStake.amount * rewardRate * stakingTime) / (100 * 30 days);

        return reward; // Return the reward amount
    }

    // Function to withdraw the staked amount + earned rewards
    function withdraw() external {
        Stake memory userStake = stakes[msg.sender];

        // Make sure user has staked something
        require(userStake.amount > 0, "No stake found");

        // Calculate total reward
        uint256 reward = calculateReward(msg.sender);

        // Total to transfer = staked amount + reward
        uint256 totalAmount = userStake.amount + reward;

        // Reset user's stake to 0 (so they can't withdraw again)
        stakes[msg.sender].amount = 0;

        // Transfer total amount back to the user
        token.transfer(msg.sender, totalAmount);
    }
} 