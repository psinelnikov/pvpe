// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract PublicVault is ERC20, Ownable {
    error ZeroAddress();
    error ZeroAmount();
    error InsufficientLiquidity();
    error UnauthorizedAgent();
    error InvalidRebalanceAmount();

    IERC20 public immutable usdcToken;
    address public dailyRebalancer;

    uint256 public totalAssets;
    uint256 public navPerShare;

    event Deposit(address indexed user, uint256 usdcAmount, uint256 shares);
    event Withdraw(address indexed user, uint256 shares, uint256 usdcAmount);
    event RebalanceAdd(uint256 amount, uint256 newNavPerShare);
    event RebalanceRemove(uint256 amount, uint256 newNavPerShare);
    event DailyRebalancerUpdated(address indexed oldAddress, address indexed newAddress);

    modifier onlyAuthorizedAgent() {
        if (msg.sender != dailyRebalancer) revert UnauthorizedAgent();
        _;
    }

    constructor(
        address _usdcToken,
        address _owner,
        address _dailyRebalancer
    ) ERC20("Swiss Consortium Vault Shares", "SCVS") Ownable(_owner) {
        if (_usdcToken == address(0)) revert ZeroAddress();
        if (_dailyRebalancer == address(0)) revert ZeroAddress();
        
        usdcToken = IERC20(_usdcToken);
        dailyRebalancer = _dailyRebalancer;
        
        navPerShare = 1e6; 
    }

    function deposit(uint256 usdcAmount) external {
        if (usdcAmount == 0) revert ZeroAmount();
        
        uint256 shares = _calculateShares(usdcAmount);
        
        bool success = usdcToken.transferFrom(msg.sender, address(this), usdcAmount);
        require(success, "USDC transfer failed");
        
        totalAssets += usdcAmount;
        _mint(msg.sender, shares);
        
        emit Deposit(msg.sender, usdcAmount, shares);
    }

    function withdraw(uint256 shares) external {
        if (shares == 0) revert ZeroAmount();
        if (balanceOf(msg.sender) < shares) revert InvalidAmount();
        
        uint256 usdcAmount = _calculateUSDC(shares);
        
        if (usdcToken.balanceOf(address(this)) < usdcAmount) revert InsufficientLiquidity();
        
        _burn(msg.sender, shares);
        totalAssets -= usdcAmount;
        
        bool success = usdcToken.transfer(msg.sender, usdcAmount);
        require(success, "USDC transfer failed");
        
        emit Withdraw(msg.sender, shares, usdcAmount);
    }

    function rebalanceAdd(uint256 amount) external onlyAuthorizedAgent {
        if (amount == 0) revert ZeroAmount();
        
        bool success = usdcToken.transferFrom(msg.sender, address(this), amount);
        require(success, "USDC transfer failed");
        
        totalAssets += amount;
        _recalculateNAV();
        
        emit RebalanceAdd(amount, navPerShare);
    }

    function rebalanceRemove(uint256 amount) external onlyAuthorizedAgent {
        if (amount == 0) revert ZeroAmount();
        if (usdcToken.balanceOf(address(this)) < amount) revert InsufficientLiquidity();
        
        bool success = usdcToken.transfer(msg.sender, amount);
        require(success, "USDC transfer failed");
        
        totalAssets -= amount;
        _recalculateNAV();
        
        emit RebalanceRemove(amount, navPerShare);
    }

    function getVaultStats() external view returns (uint256, uint256, uint256) {
        return (totalAssets, totalSupply(), navPerShare);
    }

    function _calculateShares(uint256 usdcAmount) internal view returns (uint256) {
        if (totalSupply() == 0) {
            return usdcAmount;
        }
        return (usdcAmount * totalSupply()) / totalAssets;
    }

    function _calculateUSDC(uint256 shares) internal view returns (uint256) {
        if (totalSupply() == 0) {
            return 0;
        }
        return (shares * totalAssets) / totalSupply();
    }

    function _recalculateNAV() internal {
        if (totalSupply() > 0) {
            navPerShare = (totalAssets * 1e6) / totalSupply();
        } else {
            navPerShare = 1e6;
        }
    }

    function setDailyRebalancer(address _dailyRebalancer) external onlyOwner {
        if (_dailyRebalancer == address(0)) revert ZeroAddress();
        
        address oldAddress = dailyRebalancer;
        dailyRebalancer = _dailyRebalancer;
        
        emit DailyRebalancerUpdated(oldAddress, _dailyRebalancer);
    }
}