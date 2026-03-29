// Token Discovery Script
// Helps find the correct token address for PAVEL/USDC

import { ethers } from 'ethers';

const PUBLIC_CHAIN_RPC = 'https://testnet-rpc.rayls.com';
const PRIVATE_CHAIN_RPC = 'https://privacy-node-5.rayls.com';

// Common token addresses to test (you may need to update these)
const POSSIBLE_TOKEN_ADDRESSES = [
  // USDC on Rayls Testnet (replace with actual address)
  '0x1234567890123456789012345678901234567890',
  // PAVEL native token (if it exists as a contract)
  '0x0987654321098765432109876543210987654321',
  // Add other potential addresses here
];

// ERC20 ABI for balance and info checking
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function totalSupply() view returns (uint256)'
];

async function checkToken(tokenAddress, rpcUrl, chainName) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    
    const [symbol, name, decimals, totalSupply] = await Promise.all([
      contract.symbol(),
      contract.name(),
      contract.decimals(),
      contract.totalSupply()
    ]);
    
    console.log(`✅ ${chainName} - Found token:`);
    console.log(`   Address: ${tokenAddress}`);
    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Decimals: ${decimals}`);
    console.log(`   Total Supply: ${ethers.formatEther(totalSupply)}`);
    console.log('');
    
    return { symbol, name, decimals, totalSupply };
  } catch (err) {
    console.log(`❌ ${chainName} - ${tokenAddress}: ${err.message}`);
    return null;
  }
}

async function checkBalances(tokenAddress, userAddress, rpcUrl, chainName) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const balance = await contract.balanceOf(userAddress);
    const formattedBalance = ethers.formatEther(balance);
    
    console.log(`💰 ${chainName} Balance:`);
    console.log(`   User: ${userAddress}`);
    console.log(`   Balance: ${formattedBalance}`);
    console.log('');
    
    return formattedBalance;
  } catch (err) {
    console.log(`❌ ${chainName} - Failed to get balance: ${err.message}`);
    return '0';
  }
}

async function main() {
  console.log('🔍 Token Discovery Tool');
  console.log('========================\\n');
  
  // Replace with your actual wallet address
  const USER_ADDRESS = '0x...'; // Update with your wallet address
  
  if (USER_ADDRESS === '0x...') {
    console.log('⚠️ Please update USER_ADDRESS with your actual wallet address');
    return;
  }
  
  console.log(`📍 Checking for user: ${USER_ADDRESS}\\n`);
  
  // Check each possible token address
  for (const tokenAddress of POSSIBLE_TOKEN_ADDRESSES) {
    console.log(`🔍 Checking token: ${tokenAddress}`);
    
    // Check on public chain
    const publicTokenInfo = await checkToken(tokenAddress, PUBLIC_CHAIN_RPC, 'Public');
    
    if (publicTokenInfo) {
      // If token found on public chain, check user's balance
      await checkBalances(tokenAddress, USER_ADDRESS, PUBLIC_CHAIN_RPC, 'Public');
      
      // Also check on private chain
      const privateTokenInfo = await checkToken(tokenAddress, PRIVATE_CHAIN_RPC, 'Private');
      if (privateTokenInfo) {
        await checkBalances(tokenAddress, USER_ADDRESS, PRIVATE_CHAIN_RPC, 'Private');
      }
    }
    
    console.log('---');
  }
  
  console.log('\\n📋 Instructions:');
  console.log('1. Update USER_ADDRESS with your wallet address');
  console.log('2. Update POSSIBLE_TOKEN_ADDRESSES with actual token addresses');
  console.log('3. Run: node token-discovery.js');
  console.log('4. Look for tokens that show your 0.5 balance');
  console.log('5. Use the found address in the bridge interface');
}

// Instructions for finding token addresses
console.log('📖 How to find token addresses:');
console.log('================================');
console.log('1. Check Rayls documentation or team for token addresses');
console.log('2. Look at deployed contracts from the deployment scripts');
console.log('3. Check blockchain explorers:');
console.log(`   - Public: https://testnet-explorer.rayls.com`);
console.log(`   - Check your wallet transactions to see token contracts`);
console.log('4. Check .env files for USDC_TOKEN_ADDRESS');
console.log('');

main().catch(console.error);
