#!/usr/bin/env node

import { readFileSync } from 'fs';
import { resolve } from 'path';

const AGENTPERMIT_URL = process.env.AGENTPERMIT_URL || 'http://localhost:3001';
const API_KEY = process.env.AP_API_KEY;

if (!API_KEY) {
  console.error('ERROR: AP_API_KEY environment variable is required');
  process.exit(1);
}

async function createPolicy(policy) {
  try {
    const response = await fetch(`${AGENTPERMIT_URL}/policies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(policy),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create policy ${policy.policyId}: ${error}`);
    }

    const result = await response.json();
    console.log(`✓ Created policy: ${policy.policyId}`);
    console.log(`  Name: ${result.name}`);
    console.log(`  Per-Tx Limit: ${policy.perTxLimit}`);
    console.log(`  Daily Limit: ${policy.dailyLimit}`);
    console.log('');
    return result;
  } catch (error) {
    console.error(`✗ Error creating policy ${policy.policyId}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('====================================');
  console.log('Private Vault Policy Engine');
  console.log('Policy Tier Configuration');
  console.log('====================================');
  console.log(`API URL: ${AGENTPERMIT_URL}`);
  console.log('');

  const policies = [
    {
      policyId: 'pol_conservative_bank',
      name: 'Conservative Bank Policy',
      perTxLimit: '5000000000000',
      dailyLimit: '20000000000000',
      allowedAssets: ['USDC'],
      allowedChains: [99999],
      allowedPurposeCodes: ['inter_bank_lending', 'yield_accrual', 'rebalance_add', 'rebalance_remove'],
      approvalRule: {
        thresholdAmount: '2000000000000',
        required: 2,
        approvers: process.env.CONSERVATIVE_APPROVERS?.split(',') || [],
      },
    },
    {
      policyId: 'pol_standard_bank',
      name: 'Standard Bank Policy',
      perTxLimit: '10000000000000',
      dailyLimit: '50000000000000',
      allowedAssets: ['USDC'],
      allowedChains: [99999],
      allowedPurposeCodes: ['inter_bank_lending', 'yield_accrual', 'rebalance_add', 'rebalance_remove'],
      approvalRule: {
        thresholdAmount: '5000000000000',
        required: 1,
        approvers: process.env.STANDARD_APPROVERS?.split(',') || [],
      },
    },
    {
      policyId: 'pol_institutional_bank',
      name: 'Institutional Bank Policy',
      perTxLimit: '50000000000000',
      dailyLimit: '200000000000000',
      allowedAssets: ['USDC'],
      allowedChains: [99999],
      allowedPurposeCodes: ['inter_bank_lending', 'yield_accrual', 'rebalance_add', 'rebalance_remove'],
      approvalRule: {
        thresholdAmount: '20000000000000',
        required: 2,
        approvers: process.env.INSTITUTIONAL_APPROVERS?.split(',') || [],
      },
    },
    {
      policyId: 'pol_rebalancer',
      name: 'Daily Rebalancer Policy',
      perTxLimit: '100000000000000',
      dailyLimit: '500000000000000',
      allowedAssets: ['USDC'],
      allowedChains: [99999],
      allowedPurposeCodes: ['rebalance_add', 'rebalance_remove'],
      approvalRule: {
        thresholdAmount: '50000000000000',
        required: 3,
        approvers: process.env.REBALANCER_APPROVERS?.split(',') || [],
      },
    },
  ];

  console.log(`Creating ${policies.length} policy tiers...`);
  console.log('');

  for (const policy of policies) {
    await createPolicy(policy);
  }

  console.log('====================================');
  console.log('✓ All policies configured successfully');
  console.log('====================================');
  console.log('');
  console.log('Next steps:');
  console.log('1. Register bank agents with their assigned policies');
  console.log('2. Register the Daily Rebalancer agent');
  console.log('3. Test the complete vault lifecycle');
}

main().catch(console.error);