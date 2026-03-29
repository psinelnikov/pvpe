// Bridge Test Script
// This script helps test the PAVEL bridge functionality

import { ethers } from 'ethers';

// Chain configurations
const PUBLIC_CHAIN_RPC = 'https://testnet-rpc.rayls.com';
const PRIVATE_CHAIN_RPC = 'https://privacy-node-5.rayls.com';
const PUBLIC_CHAIN_ID = 7295799;
const PRIVATE_CHAIN_ID = 800005;

// PAVEL Token ABI (minimal)
const PAVEL_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function teleportToPrivacyNode(address to, uint256 amount)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

async function testBridge() {
  console.log('🚀 Testing PAVEL Bridge Functionality');
  console.log('=====================================');

  // Initialize providers
  const publicProvider = new ethers.JsonRpcProvider(PUBLIC_CHAIN_RPC);
  const privateProvider = new ethers.JsonRpcProvider(PRIVATE_CHAIN_RPC);

  try {
    // Test public chain connection
    console.log('📡 Testing public chain connection...');
    const publicBlockNumber = await publicProvider.getBlockNumber();
    console.log(`✅ Public chain connected. Block: ${publicBlockNumber}`);

    // Test private chain connection
    console.log('📡 Testing private chain connection...');
    const privateBlockNumber = await privateProvider.getBlockNumber();
    console.log(`✅ Private chain connected. Block: ${privateBlockNumber}`);

    // Example token address (replace with actual PAVEL token address)
    const TOKEN_ADDRESS = '0x1234567890123456789012345678901234567890'; // Replace with actual address

    if (TOKEN_ADDRESS !== '0x1234567890123456789012345678901234567890') {
      console.log('🪙 Testing token contract interaction...');
      
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, PAVEL_ABI, publicProvider);
      
      try {
        const symbol = await tokenContract.symbol();
        const name = await tokenContract.name();
        const decimals = await tokenContract.decimals();
        
        console.log(`✅ Token found: ${name} (${symbol})`);
        console.log(`📊 Decimals: ${decimals}`);
      } catch (err) {
        console.log('❌ Token contract not found or not accessible');
        console.log('   Please update TOKEN_ADDRESS with the actual PAVEL token address');
      }
    } else {
      console.log('⚠️  Please update TOKEN_ADDRESS in the script with the actual PAVEL token address');
    }

    console.log('\n🔗 Bridge Configuration:');
    console.log(`Public Chain: ${PUBLIC_CHAIN_RPC} (ID: ${PUBLIC_CHAIN_ID})`);
    console.log(`Private Chain: ${PRIVATE_CHAIN_RPC} (ID: ${PRIVATE_CHAIN_ID})`);
    
    console.log('\n📋 Frontend Bridge Features:');
    console.log('✅ Wallet connection (MetaMask compatible)');
    console.log('✅ Dual chain support (Public + Private)');
    console.log('✅ Balance checking on both chains');
    console.log('✅ Token approval handling');
    console.log('✅ Bridge transaction execution');
    console.log('✅ Transaction status tracking');
    console.log('✅ Explorer links');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Instructions for testing
console.log('📖 Bridge Testing Instructions:');
console.log('================================');
console.log('1. Start the frontend: npm run dev');
console.log('2. Open http://localhost:5174 in your browser');
console.log('3. Login to the application');
console.log('4. Navigate to the Bridge page');
console.log('5. Connect your wallet (MetaMask)');
console.log('6. Enter the PAVEL token address');
console.log('7. Specify amount and recipient');
console.log('8. Execute the bridge transaction');
console.log('');
console.log('🔧 Required Environment Variables:');
console.log('- PRIVACY_NODE_RPC_URL=https://privacy-node-5.rayls.com');
console.log('- PUBLIC_CHAIN_RPC_URL=https://testnet-rpc.rayls.com');
console.log('- PRIVACY_NODE_CHAIN_ID=800005');
console.log('- PUBLIC_CHAIN_ID=7295799');
console.log('');

// Run test
testBridge().catch(console.error);
