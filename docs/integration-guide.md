# Yield Vault System - Integration Guide

## Quick Integration Overview

This guide provides the essential information for integrating your existing platform with the deployed yield vault contracts.

## Contract Addresses

### Privacy Node (Chain ID: 800005)
- **YieldVault**: `0x7e5c367489A86DC1eb4A5D54F13c71d15eFA58af`
- **YieldToken**: `0x3661E4536FCb41b9c4Fad67B78c3D218b811b0bD`
- **Original Token**: `0x6eFE2c553d060d374E105De2c5A4B4cA5050712B`

### Public Chain (Chain ID: 7295799)
- **Public Mirror**: `0x4Ad3F180D8c5fB1Cdfd6dbed5Cc1fFa5432d30F9`

### AI Agent Interface
- **Interface**: `0x623683448B023A194f66e92e47f8d6f9E9c98a18`

## Core Integration Points

### 1. User Deposit Flow

```javascript
// User deposits from public chain to yield vault
async function depositToYieldVault(userAddress, amount) {
    const publicMirror = "0x4Ad3F180D8c5fB1Cdfd6dbed5Cc1fFa5432d30F9";
    const yieldVault = "0x7e5c367489A86DC1eb4A5D54F13c71d15eFA58af";
    const privacyChainId = 800005;
    
    // Call teleportToPrivacyNode on public mirror
    const tx = await contract.teleportToPrivacyNode(
        yieldVault,
        amount,
        privacyChainId
    );
    
    return tx;
}
```

### 2. Yield Calculation

```javascript
// Calculate user's current yield
async function getUserYield(userAddress) {
    const yieldVault = new ethers.Contract(
        "0x7e5c367489A86DC1eb4A5D54F13c71d15eFA58af",
        YIELD_VAULT_ABI,
        provider
    );
    
    const [principal, yield] = await yieldVault.getUserTotalValue(userAddress);
    
    return {
        principal: principal.toString(),
        yield: yield.toString(),
        total: (principal + yield).toString()
    };
}
```

### 3. Withdrawal Processing

```javascript
// Process withdrawal from yield vault
async function processWithdrawal(userAddress, amount) {
    const yieldVault = new ethers.Contract(
        "0x7e5c367489A86DC1eb4A5D54F13c71d15eFA58af",
        YIELD_VAULT_ABI,
        signer
    );
    
    const tx = await yieldVault.withdrawToPublicChain(amount);
    return tx;
}
```

## AI Agent Integration

### 1. Agent Registration

```javascript
// Register your AI agent
async function registerAIAgent(strategy = "BALANCED") {
    const aiInterface = new ethers.Contract(
        "0x623683448B023A194f66e92e47f8d6f9E9c98a18",
        AI_INTERFACE_ABI,
        signer
    );
    
    const tx = await aiInterface.registerAgent(strategy);
    return tx;
}
```

### 2. Vault Health Monitoring

```javascript
// Monitor vault health for AI decisions
async function getVaultHealth() {
    const aiInterface = new ethers.Contract(
        "0x623683448B023A194f66e92e47f8d6f9E9c98a18",
        AI_INTERFACE_ABI,
        provider
    );
    
    const health = await aiInterface.analyzeVaultHealth();
    return health;
}
```

### 3. AI Strategy Calculation

```javascript
// Get AI-recommended strategy
async function getOptimalStrategy(userAddress, riskTolerance) {
    const aiInterface = new ethers.Contract(
        "0x623683448B023A194f66e92e47f8d6f9E9c98a18",
        AI_INTERFACE_ABI,
        provider
    );
    
    const strategy = await aiInterface.calculateOptimalStrategy(
        userAddress, 
        riskTolerance
    );
    
    return strategy;
}
```

## Key ABIs

### YieldVault ABI (Essential Functions)
```json
[
    "function getUserTotalValue(address) view returns (uint256, uint256)",
    "function withdrawToPublicChain(uint256)",
    "function getStats() view returns (uint256, uint256, uint256, uint256)",
    "function calculateUserYield(address) view returns (uint256)"
]
```

### AI Interface ABI (Essential Functions)
```json
[
    "function registerAgent(string)",
    "function analyzeVaultHealth() view returns (uint256, uint256, uint256, uint256, uint256, string)",
    "function calculateOptimalStrategy(address, uint256) view returns (string, uint256, string)",
    "function assessRisk() view returns (uint256, string, string[])"
]
```

## Environment Configuration

```bash
# Required for integration
PRIVACY_NODE_RPC_URL=https://privacy-node-5.rayls.com
PUBLIC_CHAIN_RPC_URL=https://testnet-rpc.rayls.com

# Contract addresses
YIELD_VAULT_ADDRESS=0x7e5c367489A86DC1eb4A5D54F13c71d15eFA58af
YIELD_TOKEN_ADDRESS=0x3661E4536FCb41b9c4Fad67B78c3D218b811b0bD
AI_AGENT_INTERFACE=0x623683448B023A194f66e92e47f8d6f9E9c98a18

# Chain IDs
PRIVACY_NODE_CHAIN_ID=800005
PUBLIC_CHAIN_ID=7295799
```

## Integration Workflow

### 1. Setup
```javascript
// Initialize providers and contracts
const privacyProvider = new ethers.JsonRpcProvider(PRIVACY_NODE_RPC_URL);
const publicProvider = new ethers.JsonRpcProvider(PUBLIC_CHAIN_RPC_URL);

const yieldVault = new ethers.Contract(YIELD_VAULT_ADDRESS, YIELD_VAULT_ABI, privacyProvider);
const aiInterface = new ethers.Contract(AI_AGENT_INTERFACE, AI_INTERFACE_ABI, privacyProvider);
```

### 2. User Onboarding
```javascript
// Guide user through deposit process
async function onboardUser(userAddress, initialDeposit) {
    // 1. Check user balance on public chain
    const balance = await getPublicChainBalance(userAddress);
    
    // 2. Process deposit to yield vault
    if (balance >= initialDeposit) {
        await depositToYieldVault(userAddress, initialDeposit);
        return { success: true, message: "Deposit successful" };
    }
    
    return { success: false, message: "Insufficient balance" };
}
```

### 3. Automated Yield Management
```javascript
// AI-driven yield optimization
async function optimizeYield(userAddress, riskProfile) {
    // Get AI recommendation
    const strategy = await getOptimalStrategy(userAddress, riskProfile);
    
    // Execute based on recommendation
    if (strategy.strategy === "AGGRESSIVE_COMPOUND") {
        await executeYieldOptimization(userAddress, strategy.recommendedAction);
    }
    
    return strategy;
}
```

## Error Handling

### Common Error Codes
```javascript
const ERROR_CODES = {
    INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE",
    USER_NOT_REGISTERED: "USER_NOT_REGISTERED",
    VAULT_FULL: "VAULT_FULL",
    WITHDRAWAL_LIMIT_EXCEEDED: "WITHDRAWAL_LIMIT_EXCEEDED"
};

async function handleTransaction(tx) {
    try {
        await tx.wait();
        return { success: true };
    } catch (error) {
        if (error.code === ERROR_CODES.INSUFFICIENT_BALANCE) {
            return { success: false, error: "Insufficient balance" };
        }
        // Handle other errors...
    }
}
```

## Performance Monitoring

### Key Metrics to Track
- Total deposits in vault
- Daily yield generation rate
- User withdrawal patterns
- AI agent success rate
- Vault health score

### Monitoring Implementation
```javascript
async function getSystemMetrics() {
    const stats = await yieldVault.getStats();
    const health = await aiInterface.analyzeVaultHealth();
    
    return {
        totalDeposits: stats[0],
        totalYield: stats[1],
        utilizationRate: (stats[2] * 100) / stats[0],
        healthScore: health[4],
        activeUsers: stats[3]
    };
}
```

## Security Considerations

1. **Private Key Management**: Use secure key management solutions
2. **Transaction Validation**: Validate all user inputs
3. **Rate Limiting**: Implement appropriate rate limits
4. **Audit Trails**: Log all AI agent decisions
5. **Risk Limits**: Set maximum withdrawal limits

## Support

For integration support:
- Check contract events for real-time updates
- Monitor vault health metrics
- Implement proper error handling
- Use the AI interface for risk assessment

## Next Steps

1. Set up environment variables
2. Initialize contract connections
3. Implement user deposit flow
4. Add yield monitoring
5. Integrate AI decision logic
6. Test with small amounts
7. Deploy to production

The system is ready for integration with your existing platform infrastructure.
