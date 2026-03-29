# Example Policies for Yield Vault System

This document provides example policies that demonstrate how AI agents can interact with the deployed yield vault contracts to automate yield optimization and risk management.

## Policy Types

### 1. Yield Optimization Policies

These policies focus on maximizing yield while managing risk exposure.

#### Conservative Yield Strategy
```javascript
{
  id: 'conservative-yield',
  name: 'Conservative Yield Strategy',
  description: 'Low-risk yield optimization with daily compounding',
  type: 'YIELD_OPTIMIZATION',
  parameters: {
    riskTolerance: 0.3,           // 30% risk tolerance
    compoundFrequency: 'daily',    // Compound daily
    maxWithdrawalPercentage: 50,  // Max 50% withdrawal at once
    minDepositAmount: '10',       // Minimum 10 tokens
    autoReinvest: true,            // Automatically reinvest yield
    targetAPY: 5                   // Target 5% APY
  },
  executionLogic: {
    // Compound when yield below 80% of target
    compoundThreshold: 0.8,
    // Take profits when yield exceeds 120% of target
    profitTakingThreshold: 1.2,
    // Hold position during high volatility
    volatilityLimit: 0.3
  }
}
```

#### Aggressive Growth Strategy
```javascript
{
  id: 'aggressive-growth',
  name: 'Aggressive Growth Strategy',
  description: 'High-yield strategy with frequent compounding and higher risk',
  type: 'YIELD_OPTIMIZATION',
  parameters: {
    riskTolerance: 0.8,           // 80% risk tolerance
    compoundFrequency: 'hourly',   // Compound hourly
    maxWithdrawalPercentage: 25,  // Max 25% withdrawal at once
    minDepositAmount: '50',       // Minimum 50 tokens
    autoReinvest: true,            // Automatically reinvest yield
    targetAPY: 15                  // Target 15% APY
  },
  executionLogic: {
    // Compound aggressively when opportunities arise
    compoundThreshold: 0.6,
    // Higher profit taking threshold
    profitTakingThreshold: 1.5,
    // Tolerate higher volatility
    volatilityLimit: 0.6
  }
}
```

### 2. Risk Management Policies

These policies focus on monitoring and mitigating risks in the yield vault system.

#### Risk Management Guard
```javascript
{
  id: 'risk-management',
  name: 'Risk Management Guard',
  description: 'Automated risk monitoring and mitigation',
  type: 'RISK_MANAGEMENT',
  parameters: {
    maxVaultUtilization: 0.9,        // Alert at 90% utilization
    emergencyWithdrawalThreshold: 0.15, // Emergency at 15% liquidity
    monitoringFrequency: '5min',       // Check every 5 minutes
    alertThresholds: {
      highRisk: 0.7,                   // High risk at 70%
      mediumRisk: 0.5,                 // Medium risk at 50%
      lowRisk: 0.3                     // Low risk at 30%
    }
  },
  executionLogic: {
    // Automated responses to risk events
    emergencyActions: [
      'PAUSE_COMPOUNDING',
      'LIMIT_WITHDRAWALS',
      'NOTIFY_ADMIN'
    ],
    // Risk calculation factors
    riskFactors: {
      utilizationRate: 0.3,
      liquidityRatio: 0.4,
      volatilityIndex: 0.2,
      concentrationRisk: 0.1
    }
  }
}
```

### 3. Liquidity Management Policies

These policies ensure adequate liquidity for withdrawals and operations.

#### Liquidity Provider
```javascript
{
  id: 'liquidity-provider',
  name: 'Liquidity Provider',
  description: 'Maintain optimal liquidity levels for the vault',
  type: 'LIQUIDITY_MANAGEMENT',
  parameters: {
    targetLiquidityRatio: 0.2,    // Target 20% liquidity
    minLiquidityRatio: 0.1,        // Minimum 10% liquidity
    maxLiquidityRatio: 0.4,        // Maximum 40% liquidity
    rebalanceThreshold: 0.05,      // Rebalance at 5% deviation
    provisionAmount: '100'         // Provide in 100 token chunks
  },
  executionLogic: {
    // Add liquidity when ratio drops below minimum
    addLiquidityThreshold: 0.1,
    // Remove excess liquidity when above maximum
    removeLiquidityThreshold: 0.4,
    // Gradual rebalancing
    rebalanceIncrement: 0.02
  }
}
```

## Policy Execution Flow

### 1. Policy Registration
```javascript
// Register a new policy with the execution engine
const policy = await policyEngine.registerPolicy({
  id: 'my-strategy',
  name: 'My Custom Strategy',
  type: 'YIELD_OPTIMIZATION',
  parameters: { /* ... */ }
});
```

### 2. Context Analysis
```javascript
// Analyze current market and vault conditions
const context = {
  userAddress: '0x...',
  marketConditions: {
    volatility: 0.25,
    liquidityScore: 0.8,
    marketSentiment: 'NEUTRAL'
  },
  vaultMetrics: {
    utilizationRate: 0.65,
    totalDeposits: '1000000',
    yieldRate: 0.08
  }
};
```

### 3. Decision Making
```javascript
// Execute policy logic
const result = await policyEngine.executeYieldOptimization(policy, context);

// Result contains:
// - action: 'COMPOUND' | 'WITHDRAW_YIELD' | 'HOLD' | 'RISK_ALERT'
// - reasoning: Why this action was chosen
// - riskScore: Current risk assessment (0-1)
// - executed: Whether the action was executed
```

### 4. Contract Interaction
```javascript
// Example: Compounding yield
if (result.action === 'COMPOUND') {
  const tx = await yieldVault.compoundYield(userAddress);
  await tx.wait();
}

// Example: Withdrawing yield
if (result.action === 'WITHDRAW_YIELD') {
  const tx = await yieldVault.withdrawYield(userAddress, amount);
  await tx.wait();
}
```

## Integration with Yield Vault Contracts

### Contract Addresses
- **YieldVault**: `0x7e5c367489A86DC1eb4A5D54F13c71d15eFA58af`
- **YieldToken**: `0x3661E4536FCb41b9c4Fad67B78c3D218b811b0bD`
- **AI Agent Interface**: `0x623683448B023A194f66e92e47f8d6f9E9c98a18`

### Key Contract Functions
```javascript
// YieldVault interactions
await yieldVault.getUserTotalValue(userAddress);     // Get user position
await yieldVault.getStats();                         // Get vault statistics
await yieldVault.compoundYield(userAddress);         // Compound yield
await yieldVault.withdrawToPublicChain(amount);      // Withdraw to public chain

// AI Agent Interface interactions
await aiInterface.registerAgent(strategy);            // Register AI agent
await aiInterface.analyzeVaultHealth();              // Analyze vault health
await aiInterface.calculateOptimalStrategy(user, risk); // Get strategy
await aiInterface.executeYieldOptimization(user, amount); // Execute optimization
```

## Performance Monitoring

### Policy Metrics
```javascript
const metrics = policyEngine.getPolicyMetrics('conservative-yield');
console.log(metrics);
// {
//   policyName: 'Conservative Yield Strategy',
//   executionCount: 156,
//   successRate: '98.7',
//   averageRiskScore: '25.3',
//   lastExecuted: 1640995200000,
//   status: 'ACTIVE'
// }
```

### Real-time Monitoring
```javascript
// Set up monitoring for policy performance
policyEngine.onPolicyExecuted((policyId, result) => {
  console.log(`Policy ${policyId} executed:`, result);
  
  // Update dashboard
  updatePolicyMetrics(policyId, result);
  
  // Send alerts if needed
  if (result.decision.action === 'RISK_ALERT') {
    sendRiskAlert(result);
  }
});
```

## Best Practices

### 1. Risk Management
- Always set appropriate risk tolerance levels
- Implement multiple safety checks
- Use position sizing based on risk tolerance
- Monitor market conditions continuously

### 2. Performance Optimization
- Choose appropriate compound frequencies
- Balance yield vs. gas costs
- Consider market volatility in timing
- Implement smart profit-taking strategies

### 3. Policy Design
- Start with conservative parameters
- Test policies with small amounts
- Monitor performance metrics closely
- Adjust parameters based on results

### 4. Security Considerations
- Use multi-signature wallets for critical operations
- Implement time delays for large withdrawals
- Regular security audits of policy logic
- Maintain emergency override capabilities

## Example Use Cases

### 1. Automated Yield Farming
```javascript
// User wants to automatically compound yield while managing risk
const autoFarmPolicy = {
  type: 'YIELD_OPTIMIZATION',
  parameters: {
    riskTolerance: 0.5,
    compoundFrequency: 'daily',
    autoReinvest: true,
    targetAPY: 8
  }
};
```

### 2. Risk-Averse Investing
```javascript
// Conservative investor wants stable returns with low risk
const conservativePolicy = {
  type: 'YIELD_OPTIMIZATION',
  parameters: {
    riskTolerance: 0.2,
    compoundFrequency: 'weekly',
    autoReinvest: false,
    targetAPY: 4
  }
};
```

### 3. Institutional Risk Management
```javascript
// Institution needs strict risk controls
const institutionalPolicy = {
  type: 'RISK_MANAGEMENT',
  parameters: {
    maxVaultUtilization: 0.7,
    emergencyWithdrawalThreshold: 0.2,
    monitoringFrequency: '1min'
  }
};
```

## Next Steps

1. **Deploy Policy Manager**: Use the frontend Policy Manager component
2. **Create Custom Policies**: Define policies based on your risk tolerance
3. **Test with Small Amounts**: Start with small deposits to test policies
4. **Monitor Performance**: Track policy execution and results
5. **Adjust Parameters**: Optimize policies based on performance data

The policy system provides a flexible framework for automating yield vault operations while maintaining proper risk management and security controls.
