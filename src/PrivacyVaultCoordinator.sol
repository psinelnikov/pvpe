// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IActionGate} from "./interfaces/IActionGate.sol";

contract PrivacyVaultCoordinator is Ownable {
    error ZeroAddress();
    error ZeroAmount();
    error InvalidRate();
    error InvalidPeriod();
    error PositionNotFound();
    error PositionAlreadyExists();
    error ActionGateRequired();
    error UnauthorizedAgent();
    error InsufficientBalance();
    error PublicVaultNotSet();

    IERC20 public immutable usdcToken;
    IActionGate public actionGate;
    address public publicVault;

    struct LendingPosition {
        uint256 principal;
        uint256 interestRate;
        uint256 startTimestamp;
        uint256 lastAccrualTimestamp;
        uint256 accruedInterest;
        bool active;
    }

    mapping(address => bool) public authorizedAgents;
    mapping(address => address[]) public lendersList;
    mapping(address => mapping(address => LendingPosition)) public lendingPositions;
    
    int256 public netSettlement;
    
    address[] public allLenders;
    
    event AgentAuthorized(address indexed agent, bool authorized);
    event LendingPositionOpened(
        address indexed lender, 
        address indexed borrower, 
        uint256 principal, 
        uint256 rate
    );
    event LendingPositionClosed(
        address indexed lender, 
        address indexed borrower, 
        uint256 principal, 
        uint256 interest
    );
    event YieldAccrued(
        address indexed lender, 
        address indexed borrower, 
        uint256 amount
    );
    event NetSettlementUpdated(int256 newAmount);
    event NetSettlementReset();
    event PublicVaultUpdated(address indexed oldAddress, address indexed newAddress);
    event DepositReceivedFromPublic(address indexed user, uint256 amount);
    event SharesMintedOnPublic(address indexed user, uint256 shares);

    modifier onlyAuthorizedAgent() {
        if (!authorizedAgents[msg.sender]) revert UnauthorizedAgent();
        _;
    }

    constructor(address _usdcToken, address _owner) Ownable(_owner) {
        if (_usdcToken == address(0)) revert ZeroAddress();
        usdcToken = IERC20(_usdcToken);
    }

    function setActionGate(address _actionGate) external onlyOwner {
        if (_actionGate == address(0)) revert ZeroAddress();
        actionGate = IActionGate(_actionGate);
    }

    function setPublicVault(address _publicVault) external onlyOwner {
        if (_publicVault == address(0)) revert ZeroAddress();
        
        address oldAddress = publicVault;
        publicVault = _publicVault;
        
        emit PublicVaultUpdated(oldAddress, _publicVault);
    }

    function setAuthorizedAgent(address agent, bool authorized) external onlyOwner {
        if (agent == address(0)) revert ZeroAddress();
        authorizedAgents[agent] = authorized;
        emit AgentAuthorized(agent, authorized);
    }

    function receiveDeposit(uint256 amount) external onlyAuthorizedAgent {
        if (amount == 0) revert ZeroAmount();
        if (publicVault == address(0)) revert PublicVaultNotSet();
        
        bool success = usdcToken.transferFrom(msg.sender, address(this), amount);
        require(success, "USDC transfer failed");
        
        netSettlement += int256(amount);
        emit NetSettlementUpdated(netSettlement);
        emit DepositReceivedFromPublic(msg.sender, amount);
    }

    function receiveDepositFromPublic(address user, uint256 amount) external onlyAuthorizedAgent {
        if (amount == 0) revert ZeroAmount();
        if (publicVault == address(0)) revert PublicVaultNotSet();
        
        bool success = usdcToken.transferFrom(msg.sender, address(this), amount);
        require(success, "USDC transfer failed");
        
        netSettlement += int256(amount);
        emit NetSettlementUpdated(netSettlement);
        emit DepositReceivedFromPublic(user, amount);
        
        // Calculate shares and mint them on the public chain
        uint256 shares = _calculateSharesForPublicMint(amount);
        _mintSharesOnPublic(user, shares);
    }

    function _calculateSharesForPublicMint(uint256 usdcAmount) internal view returns (uint256) {
        // For now, use 1:1 ratio. In a real implementation, this would consider
        // the current NAV of the vault
        return usdcAmount;
    }

    function _mintSharesOnPublic(address user, uint256 shares) internal {
        // This would typically involve a cross-chain call to the PublicVault
        // For now, we emit an event that can be handled by the bridge
        emit SharesMintedOnPublic(user, shares);
    }

    function openLendingPosition(
        address lender,
        address borrower,
        uint256 amount,
        uint256 ratePerDay
    ) external onlyAuthorizedAgent {
        if (lender == address(0) || borrower == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (ratePerDay > 1000) revert InvalidRate(); 
        
        if (lendingPositions[lender][borrower].active) {
            revert PositionAlreadyExists();
        }
        
        bool success = usdcToken.transferFrom(msg.sender, address(this), amount);
        require(success, "USDC transfer failed");
        
        lendingPositions[lender][borrower] = LendingPosition({
            principal: amount,
            interestRate: ratePerDay,
            startTimestamp: block.timestamp,
            lastAccrualTimestamp: block.timestamp,
            accruedInterest: 0,
            active: true
        });
        
        _addLenderToList(lender);
        lendersList[lender].push(borrower);
        
        emit LendingPositionOpened(lender, borrower, amount, ratePerDay);
    }

    function closeLendingPosition(
        address lender,
        address borrower
    ) external onlyAuthorizedAgent {
        if (!lendingPositions[lender][borrower].active) revert PositionNotFound();
        
        LendingPosition storage position = lendingPositions[lender][borrower];
        
        _accrueInterest(lender, borrower);
        
        uint256 totalRepayment = position.principal + position.accruedInterest;
        
        if (usdcToken.balanceOf(address(this)) < totalRepayment) {
            revert InsufficientBalance();
        }
        
        position.active = false;
        position.accruedInterest = 0;
        
        bool success = usdcToken.transfer(borrower, totalRepayment);
        require(success, "USDC transfer failed");
        
        netSettlement -= int256(position.principal);
        
        emit LendingPositionClosed(lender, borrower, position.principal, totalRepayment - position.principal);
        emit NetSettlementUpdated(netSettlement);
    }

    function accrueYield(
        address lender,
        address borrower
    ) external onlyAuthorizedAgent {
        if (!lendingPositions[lender][borrower].active) revert PositionNotFound();
        
        uint256 interest = _accrueInterest(lender, borrower);
        
        if (interest > 0) {
            netSettlement -= int256(interest);
            emit YieldAccrued(lender, borrower, interest);
            emit NetSettlementUpdated(netSettlement);
        }
    }

    function _accrueInterest(
        address lender,
        address borrower
    ) internal returns (uint256) {
        LendingPosition storage position = lendingPositions[lender][borrower];
        
        uint256 timeElapsed = block.timestamp - position.lastAccrualTimestamp;
        
        if (timeElapsed < 1 days) {
            return 0;
        }
        
        uint256 daysElapsed = timeElapsed / 1 days;
        uint256 interestAmount = (position.principal * position.interestRate * daysElapsed) / 10000;
        
        position.accruedInterest += interestAmount;
        position.lastAccrualTimestamp = block.timestamp;
        
        return interestAmount;
    }

    function getNetSettlement() external view onlyAuthorizedAgent returns (int256) {
        return netSettlement;
    }

    function resetNetSettlement() external onlyAuthorizedAgent {
        netSettlement = 0;
        emit NetSettlementReset();
    }

    function getLendingPosition(
        address lender,
        address borrower
    ) external view returns (LendingPosition memory) {
        return lendingPositions[lender][borrower];
    }

    function getLenderBorrowers(address lender) external view returns (address[] memory) {
        return lendersList[lender];
    }

    function getAllLenders() external view returns (address[] memory) {
        return allLenders;
    }

    function getAvailablePoolBalance() external view returns (uint256) {
        return usdcToken.balanceOf(address(this));
    }

    function _addLenderToList(address lender) internal {
        if (allLenders.length == 0) {
            allLenders.push(lender);
            return;
        }
        
        for (uint256 i = 0; i < allLenders.length; i++) {
            if (allLenders[i] == lender) {
                return;
            }
        }
        
        allLenders.push(lender);
    }
}