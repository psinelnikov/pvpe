#!/usr/bin/env node

import { createPublicClient, http } from 'viem';

const AGENTPERMIT_URL = process.env.AGENTPERMIT_URL || 'http://localhost:3001';
const API_KEY = process.env.AP_API_KEY;
const PRIVACY_NODE_RPC_URL = process.env.PRIVACY_NODE_RPC_URL || 'http://localhost:8545';

if (!API_KEY) {
  console.error('ERROR: AP_API_KEY environment variable is required');
  process.exit(1);
}

const client = createPublicClient({
  transport: http(PRIVACY_NODE_RPC_URL),
});

async function registerAgent(agentConfig) {
  try {
    const response = await fetch(`${AGENTPERMIT_URL}/agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(agentConfig),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to register agent ${agentConfig.agentId}: ${error}`);
    }

    const result = await response.json();
    console.log(`✓ Registered agent: ${agentConfig.agentId}`);
    console.log(`  Name: ${result.name}`);
    console.log(`  Wallet: ${result.walletAddr}`);
    console.log(`  Policy: ${result.policyId}`);
    console.log(`  Chain: ${result.chainId}`);
    console.log('');
    return result;
  } catch (error) {
    console.error(`✗ Error registering agent ${agentConfig.agentId}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('====================================');
  console.log('Private Vault Policy Engine');
  console.log('Agent Registration');
  console.log('====================================');
  console.log(`API URL: ${AGENTPERMIT_URL}`);
  console.log('');

  const ACTION_GATE_ADDRESS = process.env.ACTION_GATE_ADDRESS;
  const TOKEN_ADDRESS = process.env.USDC_TOKEN_ADDRESS || process.env.TOKEN_ADDRESS;

  if (!ACTION_GATE_ADDRESS) {
    console.error('ERROR: ACTION_GATE_ADDRESS environment variable is required');
    console.error('Please deploy the vault infrastructure first and set the addresses in .env');
    process.exit(1);
  }

  const chainId = parseInt(process.env.RAYLS_CHAIN_ID || '99999');

  const agents = [];

  if (process.env.DAILY_REBALANCER_PRIVATE_KEY) {
    const rebalancerAccount = privateKeyToAccount(process.env.DAILY_REBALANCER_PRIVATE_KEY);
    agents.push({
      agentId: process.env.REBALANCER_AGENT_ID || 'daily_rebalancer',
      name: 'Daily Rebalancer',
      walletAddr: rebalancerAccount.address,
      privateKey: process.env.DAILY_REBALANCER_PRIVATE_KEY,
      policyId: 'pol_rebalancer',
      orgId: process.env.ORG_ID || 'swiss_consortium',
      chainId,
      tokenAddr: TOKEN_ADDRESS,
      gateAddr: ACTION_GATE_ADDRESS,
    });
  }

  if (process.env.BANK_AGENTS_CONFIG) {
    const bankConfigs = JSON.parse(process.env.BANK_AGENTS_CONFIG);
    for (const bank of bankConfigs) {
      agents.push({
        agentId: bank.agentId,
        name: bank.name,
        walletAddr: bank.walletAddr,
        privateKey: bank.privateKey,
        policyId: bank.policyId,
        orgId: process.env.ORG_ID || 'swiss_consortium',
        chainId,
        tokenAddr: TOKEN_ADDRESS,
        gateAddr: ACTION_GATE_ADDRESS,
      });
    }
  }

  if (agents.length === 0) {
    console.warn('No agents configured. Set either:');
    console.warn('  - DAILY_REBALANCER_PRIVATE_KEY for the rebalancer');
    console.warn('  - BANK_AGENTS_CONFIG (JSON) for bank agents');
    console.warn('');
    console.warn('Example BANK_AGENTS_CONFIG:');
    console.warn(JSON.stringify([
      {
        agentId: 'bank_conservative_01',
        name: 'Conservative Bank 01',
        walletAddr: '0x...',
        privateKey: '0x...',
        policyId: 'pol_conservative_bank',
      },
    ], null, 2));
    return;
  }

  console.log(`Registering ${agents.length} agent(s)...`);
  console.log('');

  for (const agent of agents) {
    await registerAgent(agent);
  }

  console.log('====================================');
  console.log('✓ All agents registered successfully');
  console.log('====================================');
  console.log('');
  console.log('Next steps:');
  console.log('1. Test agent operations via API');
  console.log('2. Run the daily rebalancer (cron job)');
  console.log('3. Monitor vault performance');
}

import { privateKeyToAccount } from 'viem/accounts';

main().catch(console.error);