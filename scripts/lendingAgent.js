#!/usr/bin/env node

import { createPublicClient, createWalletClient, http, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const PRIVACY_NODE_RPC_URL = process.env.PRIVACY_NODE_RPC_URL || 'http://localhost:8545';
const AGENTPERMIT_URL = process.env.AGENTPERMIT_URL || 'http://localhost:3001';
const API_KEY = process.env.AP_API_KEY;
const BANK_AGENT_PRIVATE_KEY = process.env.BANK_AGENT_PRIVATE_KEY;

if (!API_KEY || !BANK_AGENT_PRIVATE_KEY) {
  console.error('ERROR: Missing required environment variables');
  console.error('Required: AP_API_KEY, BANK_AGENT_PRIVATE_KEY');
  process.exit(1);
}

const client = createPublicClient({
  transport: http(PRIVACY_NODE_RPC_URL),
});

const agentAccount = privateKeyToAccount(BANK_AGENT_PRIVATE_KEY);

const walletClient = createWalletClient({
  account: agentAccount,
  chain: { id: 99999 },
  transport: http(PRIVACY_NODE_RPC_URL),
});

const USDC_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
] as const;

const PRIVACY_COORDINATOR_ABI = [
  {
    inputs: [
      { name: 'lender', type: 'address' },
      { name: 'borrower', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'ratePerDay', type: 'uint256' },
    ],
    name: 'openLendingPosition',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'lender', type: 'address' },
      { name: 'borrower', type: 'address' },
    ],
    name: 'closeLendingPosition',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'lender', type: 'address' },
      { name: 'borrower', type: 'address' },
    ],
    name: 'accrueYield',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

async function createIntent(amount, to, purposeCode) {
  const intent = {
    requestId: `lending_${Date.now()}`,
    orgId: process.env.ORG_ID || 'swiss_consortium',
    agentId: process.env.BANK_AGENT_ID || 'bank_agent',
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

async function decideIntent(intentId, policyId) {
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

async function openLendingPosition(lender, borrower, amount, ratePerDay) {
  console.log('====================================');
  console.log('Open Lending Position');
  console.log('====================================');
  console.log(`Lender: ${lender}`);
  console.log(`Borrower: ${borrower}`);
  console.log(`Amount: ${amount} USDC`);
  console.log(`Rate: ${ratePerDay} basis points/day`);
  console.log('');

  try {
    console.log('Step 1: Creating lending intent...');
    const to = process.env.PRIVACY_COORDINATOR_ADDRESS;
    const intent = await createIntent(amount, to, 'inter_bank_lending');
    console.log(`✓ Intent created: ${intent.intentId}`);
    console.log('');

    console.log('Step 2: Requesting TEE decision...');
    const policyId = process.env.BANK_AGENT_POLICY_ID || 'pol_standard_bank';
    const decision = await decideIntent(intent.intentId, policyId);
    console.log(`✓ Decision: ${decision.decisionStatus}`);

    if (decision.decisionStatus === 'DENIED') {
      console.error(`Reasons: ${decision.reasons.join(', ')}`);
      throw new Error('Lending denied by policy');
    }

    if (decision.decisionStatus === 'NEEDS_APPROVAL') {
      console.log('⚠ Approval required. Waiting for approvers...');
      for (let i = 0; i < 24; i++) {
        await new Promise(resolve => setTimeout(resolve, 300000));
        const checkDecision = await decideIntent(intent.intentId, policyId);
        if (checkDecision.decisionStatus === 'APPROVED') {
          console.log('✓ Approvals collected');
          break;
        }
      }
      if (decision.decisionStatus !== 'APPROVED') {
        throw new Error('Approvals not collected');
      }
    }
    console.log('');

    console.log('Step 3: Approving USDC spend...');
    const usdcToken = process.env.USDC_TOKEN_ADDRESS;
    await walletClient.writeContract({
      address: usdcToken as `0x${string}`,
      abi: USDC_ABI,
      functionName: 'approve',
      args: [to, BigInt(amount)],
    });
    console.log('✓ USDC approved');
    console.log('');

    console.log('Step 4: Opening lending position...');
    const hash = await walletClient.writeContract({
      address: to as `0x${string}`,
      abi: PRIVACY_COORDINATOR_ABI,
      functionName: 'openLendingPosition',
      args: [lender as `0x${string}`, borrower as `0x${string}`, BigInt(amount), BigInt(ratePerDay)],
    });
    console.log(`✓ Position opened (tx: ${hash})`);
    console.log('');

    console.log('====================================');
    console.log('✓ Lending Position Opened');
    console.log('====================================');
    return hash;
  } catch (error) {
    console.error('');
    console.error('✗ Failed to open lending position');
    console.error(`Error: ${error.message}`);
    throw error;
  }
}

async function closeLendingPosition(lender, borrower) {
  console.log('====================================');
  console.log('Close Lending Position');
  console.log('====================================');
  console.log(`Lender: ${lender}`);
  console.log(`Borrower: ${borrower}`);
  console.log('');

  try {
    console.log('Step 1: Creating settlement intent...');
    const to = process.env.PRIVACY_COORDINATOR_ADDRESS;
    const intent = await createIntent('0', to, 'inter_bank_lending');
    console.log(`✓ Intent created: ${intent.intentId}`);
    console.log('');

    console.log('Step 2: Requesting TEE decision...');
    const policyId = process.env.BANK_AGENT_POLICY_ID || 'pol_standard_bank';
    const decision = await decideIntent(intent.intentId, policyId);
    console.log(`✓ Decision: ${decision.decisionStatus}`);

    if (decision.decisionStatus === 'DENIED') {
      console.error(`Reasons: ${decision.reasons.join(', ')}`);
      throw new Error('Settlement denied by policy');
    }

    if (decision.decisionStatus === 'NEEDS_APPROVAL') {
      console.log('⚠ Approval required. Waiting for approvers...');
      for (let i = 0; i < 24; i++) {
        await new Promise(resolve => setTimeout(resolve, 300000));
        const checkDecision = await decideIntent(intent.intentId, policyId);
        if (checkDecision.decisionStatus === 'APPROVED') {
          console.log('✓ Approvals collected');
          break;
        }
      }
      if (decision.decisionStatus !== 'APPROVED') {
        throw new Error('Approvals not collected');
      }
    }
    console.log('');

    console.log('Step 3: Closing position...');
    const hash = await walletClient.writeContract({
      address: to as `0x${string}`,
      abi: PRIVACY_COORDINATOR_ABI,
      functionName: 'closeLendingPosition',
      args: [lender as `0x${string}`, borrower as `0x${string}`],
    });
    console.log(`✓ Position closed (tx: ${hash})`);
    console.log('');

    console.log('====================================');
    console.log('✓ Lending Position Closed');
    console.log('====================================');
    return hash;
  } catch (error) {
    console.error('');
    console.error('✗ Failed to close lending position');
    console.error(`Error: ${error.message}`);
    throw error;
  }
}

async function accrueYield(lender, borrower) {
  console.log('====================================');
  console.log('Accrue Yield');
  console.log('====================================');
  console.log(`Lender: ${lender}`);
  console.log(`Borrower: ${borrower}`);
  console.log('');

  try {
    console.log('Step 1: Creating yield intent...');
    const to = process.env.PRIVACY_COORDINATOR_ADDRESS;
    const intent = await createIntent('0', to, 'yield_accrual');
    console.log(`✓ Intent created: ${intent.intentId}`);
    console.log('');

    console.log('Step 2: Requesting TEE decision...');
    const policyId = process.env.BANK_AGENT_POLICY_ID || 'pol_standard_bank';
    const decision = await decideIntent(intent.intentId, policyId);
    console.log(`✓ Decision: ${decision.decisionStatus}`);

    if (decision.decisionStatus === 'DENIED') {
      console.error(`Reasons: ${decision.reasons.join(', ')}`);
      throw new Error('Yield accrual denied by policy');
    }
    console.log('');

    console.log('Step 3: Accruing yield...');
    const hash = await walletClient.writeContract({
      address: to as `0x${string}`,
      abi: PRIVACY_COORDINATOR_ABI,
      functionName: 'accrueYield',
      args: [lender as `0x${string}`, borrower as `0x${string}`],
    });
    console.log(`✓ Yield accrued (tx: ${hash})`);
    console.log('');

    console.log('====================================');
    console.log('✓ Yield Accrual Complete');
    console.log('====================================');
    return hash;
  } catch (error) {
    console.error('');
    console.error('✗ Failed to accrue yield');
    console.error(`Error: ${error.message}`);
    throw error;
  }
}

const command = process.argv[2];
const args = process.argv.slice(3);

switch (command) {
  case 'open': {
    if (args.length < 4) {
      console.error('Usage: open <lender_address> <borrower_address> <amount_usdc> <rate_basis_points>');
      process.exit(1);
    }
    await openLendingPosition(args[0], args[1], args[2], args[3]);
    break;
  }
  case 'close': {
    if (args.length < 2) {
      console.error('Usage: close <lender_address> <borrower_address>');
      process.exit(1);
    }
    await closeLendingPosition(args[0], args[1]);
    break;
  }
  case 'accrue': {
    if (args.length < 2) {
      console.error('Usage: accrue <lender_address> <borrower_address>');
      process.exit(1);
    }
    await accrueYield(args[0], args[1]);
    break;
  }
  default:
    console.log('Usage:');
    console.log('  open <lender> <borrower> <amount> <rate>  - Open a lending position');
    console.log('  close <lender> <borrower>              - Close a lending position');
    console.log('  accrue <lender> <borrower>            - Accrue yield for a position');
    console.log('');
    console.log('Example:');
    console.log('  node scripts/lendingAgent.js open 0x1234... 0x5678... 1000000 50');
    console.log('  node scripts/lendingAgent.js close 0x1234... 0x5678...');
    console.log('  node scripts/lendingAgent.js accrue 0x1234... 0x5678...');
}