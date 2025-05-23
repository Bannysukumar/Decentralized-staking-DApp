// Define the ABI (Application Binary Interface) for the SimpleStaking contract
// This is a JSON array that describes all the functions and their parameters
const contractABI = [
    // Constructor function that takes the token address as input
    {
        "inputs": [{"internalType": "contract IERC20", "name": "_token", "type": "address"}],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    // Function to calculate rewards for a specific user address
    {
        "inputs": [{"internalType": "address", "name": "_user", "type": "address"}],
        "name": "calculateReward",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    // Function to get the contract owner's address
    {
        "inputs": [],
        "name": "owner",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    // Function to get the current reward rate (10% per 30 days)
    {
        "inputs": [],
        "name": "rewardRate",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    // Function to stake tokens, takes amount as parameter
    {
        "inputs": [{"internalType": "uint256", "name": "_amount", "type": "uint256"}],
        "name": "stake",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // Function to get stake information (amount and timestamp) for an address
    {
        "inputs": [{"internalType": "address", "name": "", "type": "address"}],
        "name": "stakes",
        "outputs": [
            {"internalType": "uint256", "name": "amount", "type": "uint256"},
            {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    // Function to get the token contract address
    {
        "inputs": [],
        "name": "token",
        "outputs": [{"internalType": "contract IERC20", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    // Function to withdraw staked tokens and rewards
    {
        "inputs": [],
        "name": "withdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// Define the ABI for the ERC20 token contract
const tokenABI = [
    // Function to transfer tokens to another address
    {
        "inputs": [{"internalType": "address", "name": "recipient", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
        "name": "transfer",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // Function to check token balance of an address
    {
        "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    // Function to approve another address to spend tokens
    {
        "inputs": [{"internalType": "address", "name": "spender", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
        "name": "approve",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// Store the deployed contract addresses
const contractAddress = "0xf9d5ff1aae03df5846ddd5685c03101b7de7d997"; // Staking contract address
const tokenAddress = "0x7a08f54c5c7823c248ebe1202dfdf9d440ec1399"; // Token contract address

// Global variables to store contract interaction instances
let provider;    // Web3 provider instance for blockchain interaction
let signer;      // Signer instance for transaction signing
let contract;    // Instance of the staking contract
let tokenContract; // Instance of the token contract

// Function to connect user's wallet (MetaMask)
async function connectWallet() {
    try {
        // Check if MetaMask is installed
        if (typeof window.ethereum !== 'undefined') {
            // Request user to connect their wallet
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Create a Web3 provider instance
            provider = new ethers.providers.Web3Provider(window.ethereum);
            // Get the signer (connected account) for sending transactions
            signer = provider.getSigner();
            
            // Create contract instances with the signer
            contract = new ethers.Contract(contractAddress, contractABI, signer);
            tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
            
            // Get the connected wallet address
            const address = await signer.getAddress();
            // Display shortened address in UI
            document.getElementById('wallet-address').textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
            // Update connect button state
            document.getElementById('connect-wallet').textContent = 'Connected';
            document.getElementById('connect-wallet').disabled = true;
            
            // Listen for account changes in MetaMask
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            
            // Update UI with current stake and balance information
            updateStakeInfo();
            updateTokenBalance();
        } else {
            // Show error if MetaMask is not installed
            showStatus('Please install MetaMask!', 'error');
        }
    } catch (error) {
        // Show any connection errors
        showStatus('Error connecting to wallet: ' + error.message, 'error');
    }
}

// Function to handle wallet account changes
function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        // If no accounts, user disconnected their wallet
        window.location.reload();
    } else {
        // Update stake info for the new account
        updateStakeInfo();
    }
}

// Function to update stake information in the UI
async function updateStakeInfo() {
    try {
        // Get current user address
        const address = await signer.getAddress();
        // Get stake information from contract
        const stake = await contract.stakes(address);
        
        // Convert and display staked amount
        document.getElementById('staked-amount').textContent = ethers.utils.formatEther(stake.amount);
        
        // Calculate and display rewards
        const rewards = await contract.calculateReward(address);
        document.getElementById('rewards').textContent = ethers.utils.formatEther(rewards);
        
        // Calculate and display staking duration in days
        const stakingTime = Math.floor((Date.now() / 1000 - stake.timestamp.toNumber()) / (24 * 60 * 60));
        document.getElementById('staking-time').textContent = stakingTime;
        
        // Get button elements
        const stakeButton = document.getElementById('stake-button');
        const withdrawButton = document.getElementById('withdraw-button');
        
        // Update button states based on stake status
        stakeButton.disabled = stake.amount.gt(0);  // Disable if already staked
        withdrawButton.disabled = stake.amount.eq(0); // Disable if nothing staked
    } catch (error) {
        // Show any errors in updating stake info
        showStatus('Error updating stake info: ' + error.message, 'error');
    }
}

// Function to update token balance in the UI
async function updateTokenBalance() {
    try {
        // Get current user address
        const address = await signer.getAddress();
        // Get token balance from contract
        const balance = await tokenContract.balanceOf(address);
        // Display formatted balance
        document.getElementById('token-balance').textContent = ethers.utils.formatEther(balance);
    } catch (error) {
        // Show any errors in updating balance
        showStatus('Error updating token balance: ' + error.message, 'error');
    }
}

// Function to stake tokens
async function stakeTokens() {
    try {
        // Get amount from input field
        const amount = document.getElementById('stake-amount').value;
        // Validate input
        if (!amount || amount <= 0) {
            showStatus('Please enter a valid amount', 'error');
            return;
        }

        // Convert amount to Wei (smallest unit)
        const amountWei = ethers.utils.parseEther(amount);
        
        // First approve the staking contract to spend tokens
        const approveTx = await tokenContract.approve(contractAddress, amountWei);
        // Wait for approval transaction to be mined
        await approveTx.wait();
        
        // Then stake the tokens
        const stakeTx = await contract.stake(amountWei);
        // Show pending status
        showStatus('Staking transaction sent! Waiting for confirmation...', 'success');
        
        // Wait for staking transaction to be mined
        await stakeTx.wait();
        // Show success message
        showStatus('Staking successful!', 'success');
        
        // Update UI with new information
        updateStakeInfo();
        updateTokenBalance();
    } catch (error) {
        // Show any staking errors
        showStatus('Error staking tokens: ' + error.message, 'error');
    }
}

// Function to withdraw staked tokens and rewards
async function withdrawTokens() {
    try {
        // Call withdraw function
        const tx = await contract.withdraw();
        // Show pending status
        showStatus('Withdrawal transaction sent! Waiting for confirmation...', 'success');
        
        // Wait for withdrawal transaction to be mined
        await tx.wait();
        // Show success message
        showStatus('Withdrawal successful!', 'success');
        // Update stake information
        updateStakeInfo();
    } catch (error) {
        // Show any withdrawal errors
        showStatus('Error withdrawing tokens: ' + error.message, 'error');
    }
}

// Function to display status messages to user
function showStatus(message, type) {
    // Get status message element
    const statusDiv = document.getElementById('status-message');
    // Set message text
    statusDiv.textContent = message;
    // Set message type (success/error)
    statusDiv.className = type;
    // Clear message after 5 seconds
    setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = '';
    }, 5000);
}

// Set up event listeners for UI interactions
document.getElementById('connect-wallet').addEventListener('click', connectWallet);
document.getElementById('stake-button').addEventListener('click', stakeTokens);
document.getElementById('withdraw-button').addEventListener('click', withdrawTokens);

// Initialize the application when page loads
window.addEventListener('load', () => {
    // Check if MetaMask is available
    if (typeof window.ethereum !== 'undefined') {
        // Reload page when network changes
        window.ethereum.on('chainChanged', () => window.location.reload());
    }
});