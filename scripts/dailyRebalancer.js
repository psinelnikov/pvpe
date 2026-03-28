#!/usr/bin/env node

import { createPublicClient, createWalletClient, http, parseUnits, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const PRIVACY_NODE_RPC_URL = process.env.PRIVACY_NODE_RPC_URL || 'http://localhost:8545';
const PUBLIC_CHAIN_RPC_URL = process.env.PUBLIC_CHAIN_RPC_URL || 'http://localhost:8546';
const AGENTPERMIT_URL = process.env.AGENTPERMIT_URL || 'http://localhost:3001';
const API_KEY = process.env.AP_API_KEY;
const DAILY_REBALANCER_PRIVATE_KEY = process.env.DAILY_REBALANCER_PRIVATE_KEY;
const PRIVACY_COORDINATOR_ADDRESS = process.env.PRIVACY_COORDINATOR_ADDRESS;
const PUBLIC_VAULT_ADDRESS = process.env.PUBLIC_VAULT_ADDRESS;
const USDC_TOKEN_ADDRESS = process.env.USDC_TOKEN_ADDRESS;

if (!API_KEY || !DAILY_REBALANCER_PRIVATE_KEY || !PRIVACY_COORDINATOR_ADDRESS || !PUBLIC_VAULT_ADDRESS) {
  console.error('ERROR: Missing required environment variables');
  console.error('Required: AP_API_KEY, DAILY_REBALANCER_PRIVATE_KEY, PRIVACY_COORDINATOR_ADDRESS, PUBLIC_VAULT_ADDRESS');
  process.exit(1);
}

const privacyClient = createPublicClient({
  transport: http(PRIVACY_NODE_RPC_URL),
});

const publicClient = createPublicClient({
  transport: http(PUBLIC_CHAIN_RPC_URL),
});

const rebalancerAccount = privateKeyToAccount(DAILY_REBALANCER_PRIVATE_KEY);

const walletClient = createWalletClient({
  account: rebalancerAccount,
  chain: { id: 99999 },
  transport: http(PRIVACY_NODE_RPC_URL),
});

const USDC_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
] as const;

const PRIVACY_COORDINATOR_ABI = [
  {
    inputs: [],
    name: 'getNetSettlement',
    outputs: [{ name: '', type: 'int256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'resetNetSettlement',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'receiveDeposit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

const PUBLIC_VAULT_ABI = [
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'rebalanceAdd',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'rebalanceRemove',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getVaultStats',
    outputs: [
      { name: 'totalAssets', type: 'uint256' },
      { name: 'totalShares', type: 'uint256' },
      { name: 'navPerShare', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

async function testTEEConnection() {
  try {
    const response = await fetch(`${AGENTPERMIT_URL}/admin/signer-config/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ endpoint: process.env.TEE_SERVICE_URL }),
    });

    if (!response.ok) {
      console.warn('⚠ TEE connection test failed');
      return false;
    }

    const result = await response.json();
    console.log(`✓ TEE Connection: ${result.status}`);
    return true;
  } catch (error) {
    console.warn('⚠ TEE connection test failed:', error.message);
    return false;
  }
}

async function createIntent(amount, to, purposeCode) {
  const intent = {
    requestId: `rebalance_${Date.now()}`,
    orgId: process.env.ORG_ID || 'swiss_consortium',
    agentId: process.env.REBALANCER_AGENT_ID || 'daily_rebalancer',
    actionType: 'TRANSFER',
    asset: 'USDC',
    amount: amount.toString(),
    to,
    purposeCode,
    chainId: 99999,
    expiry: Math.floor(Date.now() / 1000) + 3600,
    nonce: `nonce_${Date.now()}_${Math.random().toString(36).substring(7)}`,
  };

  const response = await fetch(`${AGENTPERMIT_URL}/intents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(intent),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create intent: ${error}`);
  }

  return await response.json();
}

async function decideIntent(intentId, policyId = 'pol_rebalancer') {
  const response = await fetch(`${AGENTPERMIT_URL}/intents/${intentId}/decide`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ policyId }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to decide intent: ${error}`);
  }

  return await response.json();
}

async function getNetSettlement() {
  const settlement = await privacyClient.readContract({
    address: PRIVACY_COORDINATOR_ADDRESS as `0x${string}`,
    abi: PRIVACY_COORDINATOR_ABI,
    functionName: 'getNetSettlement',
  });
  return Number(settlement);
}

async function resetNetSettlement() {
  const hash = await walletClient.writeContract({
    address: PRIVACY_COORDINATOR_ADDRESS as `0x${string}`,
    abi: PRIVACY_COORDINATOR_ABI,
    functionName: 'resetNetSettlement',
  });
  console.log(`✓ Reset net settlement (tx: ${hash})`);
  return hash;
}

async function rebalanceAdd(amount) {
  console.log(`Executing rebalanceAdd for ${amount} USDC...`);
  
  const hash = await walletClient.writeContract({
    address: PUBLIC_VAULT_ADDRESS as `0x${string}`,
    abi: PUBLIC_VAULT_ABI,
    functionName: 'rebalanceAdd',
    args: [BigInt(amount)],
  });

  console.log(`✓ RebalanceAdd executed (tx: ${hash})`);
  return hash;
}

async function rebalanceRemove(amount) {
  console.log(`Executing rebalanceRemove for ${amount} USDC...`);
  
  const hash = await walletClient.writeContract({
    address: PUBLIC_VAULT_ADDRESS as `0x${string}`,
    abi: PUBLIC_VAULT_ABI,
    functionName: 'rebalanceRemove',
    args: [BigInt(amount)],
  });

  console.log(`✓ RebalanceRemove executed (tx: ${hash})`);
  return hash;
}

async function getVaultStats() {
  const stats = await publicClient.readContract({
    address: PUBLIC_VAULT_ADDRESS as `0x${string}`,
    abi: PUBLIC_VAULT_ABI,
    functionName: 'getVaultStats',
  });
  return stats;
}

async function executeDailyRebalance() {
  console.log('====================================');
  console.log('Daily Rebalance - Execution');
  console.log('====================================');
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log('');

  try {
    console.log('Step 1: Testing TEE connection...');
    const teeConnected = await testTEEConnection();
    if (!teeConnected) {
      throw new Error('TEE connection failed');
    }
    console.log('');

    console.log('Step 2: Reading net settlement...');
    const netSettlement = await getNetSettlement();
    console.log(`Net Settlement: ${netSettlement}`);
    
    if (netSettlement === 0) {
      console.log('No rebalance needed (net settlement is zero)');
      console.log('');
      console.log('====================================');
      console.log('✓ Daily Rebalance Complete');
      console.log('====================================');
      return;
    }
    console.log('');

    console.log('Step 3: Creating rebalance intent...');
    const amount = Math.abs(netSettlement);
    const purposeCode = netSettlement > 0 ? 'rebalance_add' : 'rebalance_remove';
    const to = netSettlement > 0 ? PUBLIC_VAULT_ADDRESS : PRIVACY_COORDINATOR_ADDRESS;
    
    console.log(`Amount: ${amount}`);
    console.log(`Purpose: ${purposeCode}`);
    console.log(`To: ${to}`);

    const intent = await createIntent(amount, to, purposeCode);
    console.log(`✓ Intent created: ${intent.intentId}`);
    console.log(`  Intent Hash: ${intent.intentHash}`);
    console.log('');

    console.log('Step 4: Requesting TEE decision...');
    const decision = await decideIntent(intent.intentId);
    console.log(`✓ Decision received: ${decision.decisionStatus}`);

    if (decision.decisionStatus === 'DENIED') {
      console.error(`Reasons: ${decision.reasons.join(', ')}`);
      throw new Error('Intent was DENIED');
    }

    if (decision.decisionStatus === 'NEEDS_APPROVAL') {
      console.log('⚠ Intent requires approval');
      console.log(`Approvals collected: ${decision.approvalsCollected}/${decision.approvalsRequired}`);
      console.log('Waiting for approvals... (check approval queue)');

      for (let i = 0; i < 24; i++) {
        await new Promise(resolve => setTimeout(resolve, 300000));
        const checkDecision = await decideIntent(intent.intentId);
        if (checkDecision.decisionStatus === 'APPROVED') {
          console.log('✓ Approvals collected');
          break;
        }
      }

      if (decision.decisionStatus !== 'APPROVED') {
        throw new Error('Approvals not collected within 2 hours');
      }
    }

    console.log('');

    console.log('Step 5: Executing rebalance operation...');
    if (netSettlement > 0) {
      await rebalanceAdd(amount);
    } else {
      await rebalanceRemove(amount);
    }
    console.log('');

    console.log('Step 6: Getting updated vault stats...');
    const stats = await getVaultStats();
    console.log(`Total Assets: ${formatUnits(stats[0], 6)} USDC`);
    console.log(`Total Shares: ${stats[1]}`);
    console.log(`NAV Per Share: ${formatUnits(stats[2], 6)} USDC`);
    console.log('');

    console.log('Step 7: Resetting net settlement...');
    await resetNetSettlement();
    console.log('');

    console.log('====================================');
    console.log('✓ Daily Rebalance Complete');
    console.log('====================================');
    console.log(`Completed at: ${new Date().toISOString()}`);

  } catch (error) {
    console.error('');
    console.error('====================================');
    console.error('✗ Daily Rebalance Failed');
    console.error('====================================');
    console.error(`Error: ${error.message}`);
    console.error(`Timestamp: ${new Date().toISOString()}`);
    console.error('');
    console.error('Action Required: Manual review needed');
    process.exit(1);
  }
}

executeDailyRebalance();