// Debug PAVEL Balance Script
// Run this in browser console or as a standalone script

import { ethers } from 'ethers';

// Chain configurations
const PUBLIC_CHAIN_RPC = 'https://testnet-rpc.rayls.com';
const PRIVATE_CHAIN_RPC = 'https://privacy-node-5.rayls.com';

async function debugBalance() {
  console.log('🔍 Debugging PAVEL Balance Issue');
  console.log('==================================');
  
  // Test 1: Direct provider connection
  console.log('\n📡 Testing provider connections...');
  
  try {
    const publicProvider = new ethers.JsonRpcProvider(PUBLIC_CHAIN_RPC);
    const privateProvider = new ethers.JsonRpcProvider(PRIVATE_CHAIN_RPC);
    
    // Test public chain
    const publicBlockNumber = await publicProvider.getBlockNumber();
    console.log(`✅ Public chain connected - Block: ${publicBlockNumber}`);
    
    // Test private chain  
    const privateBlockNumber = await privateProvider.getBlockNumber();
    console.log(`✅ Private chain connected - Block: ${privateBlockNumber}`);
    
    // Test 2: Get your wallet address (you need to set this)
    const WALLET_ADDRESS = '0x...'; // REPLACE WITH YOUR ACTUAL WALLET ADDRESS
    
    if (WALLET_ADDRESS === '0x...') {
      console.log('\n⚠️ Please update WALLET_ADDRESS with your actual wallet address');
      console.log('You can find this in MetaMask or when you connect to the dApp');
      return;
    }
    
    console.log(`\n📍 Testing balance for: ${WALLET_ADDRESS}`);
    
    // Test 3: Get native balance on public chain
    console.log('\n💰 Testing public chain balance...');
    const publicBalance = await publicProvider.getBalance(WALLET_ADDRESS);
    const publicBalanceFormatted = ethers.formatEther(publicBalance);
    console.log(`Raw: ${publicBalance.toString()}`);
    console.log(`Formatted: ${publicBalanceFormatted} PAVEL`);
    
    // Test 4: Get native balance on private chain
    console.log('\n💰 Testing private chain balance...');
    const privateBalance = await privateProvider.getBalance(WALLET_ADDRESS);
    const privateBalanceFormatted = ethers.formatEther(privateBalance);
    console.log(`Raw: ${privateBalance.toString()}`);
    console.log(`Formatted: ${privateBalanceFormatted} PAVEL`);
    
    // Test 5: Check if balance is actually 0.5
    console.log('\n🔍 Balance Analysis:');
    if (parseFloat(publicBalanceFormatted) > 0) {
      console.log(`✅ Found balance: ${publicBalanceFormatted} PAVEL on public chain`);
    } else {
      console.log('❌ No balance found on public chain');
    }
    
    if (parseFloat(privateBalanceFormatted) > 0) {
      console.log(`✅ Found balance: ${privateBalanceFormatted} PAVEL on private chain`);
    } else {
      console.log('❌ No balance found on private chain');
    }
    
    // Test 6: Check network info
    console.log('\n🌐 Network Information:');
    const publicNetwork = await publicProvider.getNetwork();
    const privateNetwork = await privateProvider.getNetwork();
    
    console.log(`Public chain: ${publicNetwork.name} (Chain ID: ${publicNetwork.chainId})`);
    console.log(`Private chain: ${privateNetwork.name} (Chain ID: ${privateNetwork.chainId})`);
    
  } catch (error) {
    console.error('❌ Debug script failed:', error);
    console.log('Possible issues:');
    console.log('- Network connection problems');
    console.log('- Invalid RPC URLs');
    console.log('- Wallet address format issues');
  }
}

// Browser console version (run this directly in browser console)
function browserDebugBalance() {
  console.log('🔍 Browser Debug - PAVEL Balance');
  console.log('==============================');
  
  // Get the Web3Context from the React app (if available)
  if (window.web3Context) {
    console.log('✅ Web3Context found');
    const { account, publicProvider, privateProvider } = window.web3Context;
    console.log(`Account: ${account}`);
    
    if (account && publicProvider) {
      publicProvider.getBalance(account).then(balance => {
        const formatted = ethers.formatEther(balance);
        console.log(`Public balance: ${formatted} PAVEL`);
      }).catch(err => {
        console.error('Failed to get public balance:', err);
      });
    }
    
    if (account && privateProvider) {
      privateProvider.getBalance(account).then(balance => {
        const formatted = ethers.formatEther(balance);
        console.log(`Private balance: ${formatted} PAVEL`);
      }).catch(err => {
        console.error('Failed to get private balance:', err);
      });
    }
  } else {
    console.log('❌ Web3Context not found in window');
    console.log('Make sure the dApp is loaded and try again');
  }
}

// Instructions
console.log('📖 How to use this debug script:');
console.log('==================================');
console.log('1. For Node.js: node debug-balance.js');
console.log('2. For browser: Copy and run browserDebugBalance() in console');
console.log('3. Update WALLET_ADDRESS with your actual address');
console.log('4. Check the output for balance information');

// Uncomment to run immediately in Node.js
// debugBalance().catch(console.error);
