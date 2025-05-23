// SPDX-License-Identifier: MIT
// This line specifies the license for the contract (MIT License)

pragma solidity ^0.8.0;
// Specifies the Solidity version to use (0.8.0 or higher)

contract SimpleToken {
    // State variables for token information
    string public name = "Simple Token";        // Name of the token
    string public symbol = "SIMP";             // Symbol/ticker of the token
    uint8 public decimals = 18;                // Number of decimal places (standard for most tokens)
    uint256 public totalSupply = 1000000 * 10**18; // Total supply: 1 million tokens with 18 decimals

    // Mapping to store token balances for each address
    mapping(address => uint256) public balanceOf;
    
    // Mapping to store approved spending allowances
    // First address is the token owner, second is the spender, uint256 is the amount
    mapping(address => mapping(address => uint256)) public allowance;

    // Events to emit for important state changes
    event Transfer(address indexed from, address indexed to, uint256 value);  // Emitted when tokens are transferred
    event Approval(address indexed owner, address indexed spender, uint256 value);  // Emitted when spending is approved

    // Constructor function - runs once when contract is deployed
    constructor() {
        // Assign all tokens to the contract deployer
        balanceOf[msg.sender] = totalSupply;
        // Emit transfer event from zero address to deployer
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    // Function to transfer tokens to another address
    function transfer(address _to, uint256 _value) public returns (bool success) {
        // Check if sender has enough tokens
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        // Check if recipient address is valid
        require(_to != address(0), "Invalid recipient");

        // Subtract tokens from sender
        balanceOf[msg.sender] -= _value;
        // Add tokens to recipient
        balanceOf[_to] += _value;
        // Emit transfer event
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    // Function to approve another address to spend tokens
    function approve(address _spender, uint256 _value) public returns (bool success) {
        // Check if spender address is valid
        require(_spender != address(0), "Invalid spender");
        
        // Set the allowance amount
        allowance[msg.sender][_spender] = _value;
        // Emit approval event
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    // Function to transfer tokens on behalf of another address
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        // Check if sender has enough tokens
        require(balanceOf[_from] >= _value, "Insufficient balance");
        // Check if spender has enough allowance
        require(allowance[_from][msg.sender] >= _value, "Insufficient allowance");
        // Check if recipient address is valid
        require(_to != address(0), "Invalid recipient");

        // Subtract tokens from sender
        balanceOf[_from] -= _value;
        // Add tokens to recipient
        balanceOf[_to] += _value;
        // Reduce the allowance
        allowance[_from][msg.sender] -= _value;
        
        // Emit transfer event
        emit Transfer(_from, _to, _value);
        return true;
    }

    // Function to mint new tokens (for testing purposes)
    function mint(address _to, uint256 _amount) public {
        // Check if recipient address is valid
        require(_to != address(0), "Invalid recipient");
        
        // Increase total supply
        totalSupply += _amount;
        // Add tokens to recipient
        balanceOf[_to] += _amount;
        // Emit transfer event from zero address
        emit Transfer(address(0), _to, _amount);
    }
}