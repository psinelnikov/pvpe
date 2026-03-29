import { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

// Chain configurations
export const CHAINS = {
  PUBLIC: {
    chainId: '0x6f5f67', // 7295799 in hex
    chainName: 'Rayls Testnet',
    rpcUrls: ['https://testnet-rpc.rayls.com'],
    nativeRpcUrl: 'https://testnet-rpc.rayls.com',
    nativeCurrency: {
      name: 'PAVEL',
      symbol: 'PAVEL',
      decimals: 18,
    },
    blockExplorerUrls: ['https://testnet-explorer.rayls.com'],
  },
  PRIVATE: {
    chainId: '0xc3505', // 800005 in hex
    chainName: 'Rayls Privacy Node',
    rpcUrls: ['https://privacy-node-5.rayls.com'],
    nativeCurrency: {
      name: 'PAVEL',
      symbol: 'PAVEL',
      decimals: 18,
    },
  },
};

// PAVEL Token ABI (minimal ERC20 + bridge functions)
const PAVEL_ABI = [
  // ERC20 functions
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  
  // Bridge functions (from RaylsErc20Handler)
  'function teleportToPublicChain(address to, uint256 value, uint256 chainId)',
  'function receiveTeleportFromPublicChain(address to, uint256 value)',
  'function revertTeleportToPublicChain(address to, uint256 value)',
  
  // Public Mirror functions (from integration guide)
  'function teleportToPrivacyNode(address to, uint256 amount, uint256 chainId)',
  
  // Native token bridging functions
  'function teleport(address to, uint256 id, uint256 amount, uint256 chainId, bytes data)',
  'function teleportAtomic(address to, uint256 id, uint256 amount, uint256 chainId, bytes data)',
];

export function Web3Provider({ children }) {
  const [publicProvider, setPublicProvider] = useState(null);
  const [privateProvider, setPrivateProvider] = useState(null);
  const [publicSigner, setPublicSigner] = useState(null);
  const [privateSigner, setPrivateSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  // Initialize providers - use wallet provider instead of direct RPC to avoid CORS
  useEffect(() => {
    const initProviders = () => {
      try {
        // For browser environment, we'll use the wallet provider when connected
        // For now, set up placeholder providers that will be replaced by wallet
        console.log('🔧 Web3Context initialized - waiting for wallet connection');
      } catch (err) {
        console.error('Failed to initialize providers:', err);
        setError('Failed to initialize blockchain connection');
      }
    };

    initProviders();
  }, []);

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask or compatible wallet not found');
      return false;
    }

    setIsConnecting(true);
    setError('');

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        setError('No accounts found');
        return false;
      }

      const account = accounts[0];
      setAccount(account);

      // Create provider and signer from wallet
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Set the public provider and signer to use the wallet
      setPublicProvider(provider);
      setPublicSigner(signer);

      // Add public chain to MetaMask if not already added
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: CHAINS.PUBLIC.chainId }],
        });
        console.log('✅ Switched to Rayls Testnet');
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          console.log('🔧 Adding Rayls Testnet to MetaMask...');
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: CHAINS.PUBLIC.chainId,
                chainName: CHAINS.PUBLIC.chainName,
                rpcUrls: [CHAINS.PUBLIC.nativeRpcUrl],
                nativeCurrency: CHAINS.PUBLIC.nativeCurrency,
                blockExplorerUrls: CHAINS.PUBLIC.blockExplorerUrls,
              }],
            });
            console.log('✅ Added Rayls Testnet to MetaMask');
          } catch (addError) {
            console.warn('⚠️ Failed to add chain:', addError.message);
            // Continue anyway - provider should still work
          }
        } else {
          console.warn('⚠️ Chain switch failed:', switchError.message);
        }
      }

      // Set up private provider using proxy
      try {
        const privateProvider = new ethers.JsonRpcProvider(CHAINS.PRIVATE.rpcUrls[0]);
        setPrivateProvider(privateProvider);
        console.log('✅ Private provider set up via proxy');
      } catch (err) {
        console.warn('⚠️ Could not set up private provider:', err.message);
        // Continue without private provider - user can still see public balance
      }

      console.log('✅ Wallet connected successfully');
      console.log(`📍 Account: ${account}`);
      console.log(`🌐 Chain: ${CHAINS.PUBLIC.chainName}`);
      console.log(`📡 Public provider: ${provider ? 'Available' : 'Not available'}`);
      console.log(`📡 Private provider: ${privateProvider ? 'Available' : 'Not available'}`);

      return true;
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      setError(err.message);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setPublicSigner(null);
    setPrivateSigner(null);
    setError('');
  };

  // Get token contract instance
  const getTokenContract = (tokenAddress, chain = 'PUBLIC') => {
    const provider = chain === 'PUBLIC' ? publicProvider : privateProvider;
    const signer = chain === 'PUBLIC' ? publicSigner : privateSigner;
    
    if (!provider || !signer) {
      throw new Error(`${chain} provider or signer not available`);
    }

    return new ethers.Contract(tokenAddress, PAVEL_ABI, signer);
  };

  // Get token contract with signer for transactions
  const getTokenContractWithSigner = (tokenAddress, chain = 'PUBLIC') => {
    const provider = chain === 'PUBLIC' ? publicProvider : privateProvider;
    const signer = chain === 'PUBLIC' ? publicSigner : privateSigner;
    
    if (!provider || !signer) {
      throw new Error(`${chain} provider or signer not available`);
    }

    return new ethers.Contract(tokenAddress, PAVEL_ABI, signer);
  };

  // Generic getContract function for external use
  const getContract = (address, abi, chain = 'PUBLIC') => {
    const provider = chain === 'PUBLIC' ? publicProvider : privateProvider;
    const signer = chain === 'PUBLIC' ? publicSigner : privateSigner;
    
    if (!provider || !signer) {
      throw new Error(`${chain} provider or signer not available`);
    }

    return new ethers.Contract(address, abi, signer);
  };

  // Bridge PAVEL from public to private chain
  const mintToVault = async (tokenAddress, amount) => {
    if (!account || !publicProvider) {
      throw new Error('Wallet not connected');
    }

    try {
      // Get the YieldVault contract address
      const vaultAddress = '0x7e5c367489A86DC1eb4A5D54F13c71d15eFA58af';
      
      // Create contract instance for YieldVault
      const vaultContract = new ethers.Contract(
        vaultAddress,
        [
          'function mint(address to, uint256 amount)',
          'function balanceOf(address account) view returns (uint256)',
          'function totalSupply() view returns (uint256)'
        ],
        publicSigner
      );

      // Convert amount to wei (assuming 18 decimals)
      const amountInWei = ethers.parseUnits(amount, 18);

      console.log('🏦 Minting to vault:', {
        vaultAddress,
        tokenAddress,
        amount,
        amountInWei: amountInWei.toString(),
        account
      });

      // Call mint function on vault contract
      const tx = await vaultContract.mint(account, amountInWei);
      
      console.log('📝 Mint transaction submitted:', tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      console.log('✅ Mint transaction confirmed:', receipt);
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('❌ Failed to mint to vault:', error);
      
      if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        throw new Error('Transaction may fail. Please check your balance and gas fees.');
      }
      
      if (error.message.includes('insufficient funds')) {
        throw new Error('Insufficient funds for gas fees');
      }
      
      throw new Error(`Mint to vault failed: ${error.message}`);
    }
  };

  const bridgeToPrivate = async (tokenAddress, amount, recipient) => {
    if (!publicSigner) {
      throw new Error('Wallet not connected');
    }

    try {
      const amountWei = ethers.parseEther(amount.toString());
      
      // Handle native PAVEL bridging vs ERC20 token bridging
      if (!tokenAddress) {
        // Native PAVEL bridging using teleport function
        console.log('🪙 Bridging native PAVEL token');
        
        // Use the Public Mirror contract from the integration guide
        const publicMirrorAddress = "0x4Ad3F180D8c5fB1Cdfd6dbed5Cc1fFa5432d30F9";
        const yieldVaultAddress = "0x7e5c367489A86DC1eb4A5D54F13c71d15eFA58af";
        const privacyChainId = 800005;
        
        console.log('🚀 Bridging native PAVEL via Public Mirror contract');
        
        // Get the Public Mirror contract
        const publicMirror = getTokenContractWithSigner(publicMirrorAddress, 'PUBLIC');
        
        // Call teleportToPrivacyNode as specified in the integration guide
        const tx = await publicMirror.teleportToPrivacyNode(
            yieldVaultAddress,  // Send to YieldVault on privacy node
            amountWei,         // Amount in wei
            privacyChainId     // Privacy node chain ID
        );
        
        await tx.wait();
        console.log('✅ Native PAVEL bridge transaction confirmed:', tx.hash);
        return {
          transactionHash: tx.hash,
          blockNumber: tx.blockNumber || 'pending',
          gasUsed: tx.gasLimit?.toString() || 'unknown'
        };
        
      } else if (tokenAddress.toLowerCase() === '0x75da1758161588fd2ccbfd23ab87f373b0f73c8f'.toLowerCase()) {
        // Deployment proxy registry - handles native PAVEL bridging
        console.log('🪙 Bridging native PAVEL via deployment proxy registry');
        
        // Use the Public Mirror contract instead
        const publicMirrorAddress = "0x4Ad3F180D8c5fB1Cdfd6dbed5Cc1fFa5432d30F9";
        const yieldVaultAddress = "0x7e5c367489A86DC1eb4A5D54F13c71d15eFA58af";
        const privacyChainId = 800005;
        
        console.log('🚀 Using Public Mirror contract for native PAVEL bridging');
        
        const publicMirror = getTokenContractWithSigner(publicMirrorAddress, 'PUBLIC');
        
        const tx = await publicMirror.teleportToPrivacyNode(
            yieldVaultAddress,
            amountWei,
            privacyChainId
        );
        
        await tx.wait();
        console.log('✅ Native PAVEL bridge transaction confirmed:', tx.hash);
        return {
          transactionHash: tx.hash,
          blockNumber: tx.blockNumber || 'pending',
          gasUsed: tx.gasLimit?.toString() || 'unknown'
        };
        
      } else {
        // ERC20 token bridging - check if it's PAVEL token or YieldToken
        console.log('🪙 Bridging ERC20 token:', tokenAddress);
        
        const contract = getTokenContractWithSigner(tokenAddress, 'PUBLIC');
        
        // Check if it's PAVEL token (use teleportToPrivacyNode)
        if (tokenAddress.toLowerCase() === '0x4ad3f180d8c5fb1cdfd6dbed5cc1ffa5432d30f9'.toLowerCase()) {
          console.log('🔄 Using PAVEL token - teleportToPrivacyNode to YieldVault');
          
          // For PAVEL tokens, use teleportToPrivacyNode to send to YieldVault
          const yieldVaultAddress = "0x7e5c367489A86DC1eb4A5D54F13c71d15eFA58af";
          const privacyChainId = 800005;
          
          // Check allowance (if needed)
          const allowance = await contract.allowance(account, tokenAddress);
          if (allowance < amountWei) {
            console.log('🔐 Approving PAVEL token...');
            const approveTx = await contract.approve(tokenAddress, amountWei);
            await approveTx.wait();
            console.log('✅ PAVEL token approved');
          }
          
          // Use teleportToPrivacyNode to send to YieldVault
          const tx = await contract.teleportToPrivacyNode(
            yieldVaultAddress,  // Send to YieldVault
            amountWei,
            privacyChainId
          );
          await tx.wait();
          console.log('✅ PAVEL token bridge transaction confirmed:', tx.hash);
          return {
            transactionHash: tx.hash,
            blockNumber: tx.blockNumber || 'pending',
            gasUsed: tx.gasLimit?.toString() || 'unknown'
          };
          
        } else {
          // For YieldToken and other ERC20s, use teleportToPublicChain
          console.log('🔄 Using YieldToken/other - teleportToPublicChain');
          
          // Check allowance
          const allowance = await contract.allowance(account, tokenAddress);
          if (allowance < amountWei) {
            console.log('🔐 Approving token...');
            const approveTx = await contract.approve(tokenAddress, amountWei);
            await approveTx.wait();
            console.log('✅ Token approved');
          }

          // Use teleportToPublicChain with private chain ID
          const privateChainId = CHAINS.PRIVATE.chainId;
          console.log('🚀 Executing bridge transaction to private chain...');
          
          const tx = await contract.teleportToPublicChain(recipient, amountWei, parseInt(privateChainId, 16));
          await tx.wait();
          console.log('✅ Bridge transaction confirmed:', tx.hash);

          return {
            transactionHash: tx.hash,
            blockNumber: tx.blockNumber || 'pending',
            gasUsed: tx.gasLimit?.toString() || 'unknown'
          };
        }
      }

    } catch (err) {
      console.error('Bridge transaction failed:', err);
      throw new Error(err.message || 'Bridge transaction failed');
    }
  };

  // Get balance (supports both native tokens and ERC20)
  const getBalance = async (tokenAddress, chain = 'PUBLIC', userAddress = account) => {
    if (!userAddress) {
      console.log('⚠️ getBalance: No user address provided');
      return '0';
    }

    console.log(`🔍 Getting balance for ${userAddress} on ${chain} chain`);
    
    try {
      // For private chain, check YieldVault or YieldToken contracts
      if (chain === 'PRIVATE') {
        console.log('🔍 Checking private chain balance...');
        console.log('📍 Token address being checked:', tokenAddress || 'native');
        console.log('👤 User address being checked:', userAddress);
        
        if (!privateProvider) {
          console.log('❌ Private provider not available');
          return '0';
        }
        
        try {
          // If we have a token address, determine which contract to check
          if (tokenAddress && tokenAddress !== '') {
            // If checking the public mirror address, map it to private chain contracts
            if (tokenAddress.toLowerCase() === '0x4Ad3F180D8c5fB1Cdfd6dbed5Cc1fFa5432d30F9'.toLowerCase()) {
              console.log('� Mapping public mirror to private chain contracts...');
              
              // Check YieldVault first (where bridged tokens go)
              const yieldVaultAddress = '0x7e5c367489A86DC1eb4A5D54F13c71d15eFA58af';
              console.log('🏦 Checking YieldVault balance:', yieldVaultAddress);
              
              try {
                const yieldVaultContract = new ethers.Contract(
                  yieldVaultAddress,
                  [
                    'function getUserTotalValue(address) view returns (uint256, uint256)',
                    'function balanceOf(address) view returns (uint256)'
                  ],
                  privateProvider
                );
                
                // Try getUserTotalValue first (from integration guide)
                try {
                  const [principal, userYield] = await yieldVaultContract.getUserTotalValue(userAddress);
                  console.log('💰 YieldVault principal:', ethers.formatEther(principal));
                  console.log('📈 YieldVault yield:', ethers.formatEther(userYield));
                  
                  const total = principal + userYield;
                  const formatted = ethers.formatEther(total);
                  console.log(`✅ YieldVault total value: ${formatted} PAVEL`);
                  return formatted;
                } catch (valueErr) {
                  console.log('⚠️ getUserTotalValue failed, trying balanceOf...');
                  
                  // Fallback to balanceOf
                  const balance = await yieldVaultContract.balanceOf(userAddress);
                  const formatted = ethers.formatEther(balance);
                  console.log(`✅ YieldVault balance: ${formatted} PAVEL`);
                  return formatted;
                }
              } catch (vaultErr) {
                console.error('❌ YieldVault check failed:', vaultErr.message);
                
                // Try YieldToken as fallback
                const yieldTokenAddress = '0x3661E4536FCb41b9c4Fad67B78c3D218b811b0bD';
                console.log('🪙 Checking YieldToken balance:', yieldTokenAddress);
                
                try {
                  const yieldTokenContract = new ethers.Contract(
                    yieldTokenAddress,
                    [
                      'function balanceOf(address) view returns (uint256)',
                      'function name() view returns (string)',
                      'function symbol() view returns (string)',
                      'function decimals() view returns (uint8)'
                    ],
                    privateProvider
                  );
                  
                  const balance = await yieldTokenContract.balanceOf(userAddress);
                  const formatted = ethers.formatEther(balance);
                  console.log(`✅ YieldToken balance: ${formatted} PAVEL`);
                  return formatted;
                } catch (tokenErr) {
                  console.error('❌ YieldToken check failed:', tokenErr.message);
                }
              }
            } else {
              // For other token addresses, try direct contract call
              console.log('🪙 Checking other ERC20 token on private chain:', tokenAddress);
              
              const tokenContract = new ethers.Contract(
                tokenAddress,
                [
                  'function balanceOf(address account) view returns (uint256)',
                  'function name() view returns (string)',
                  'function symbol() view returns (string)',
                  'function decimals() view returns (uint8)'
                ],
                privateProvider
              );
              
              const balance = await tokenContract.balanceOf(userAddress);
              const formatted = ethers.formatEther(balance);
              console.log(`✅ Token balance: ${formatted} PAVEL`);
              return formatted;
            }
          } else {
            // For native PAVEL, check direct balance
            console.log('🪙 Checking native PAVEL balance on private chain');
            const balance = await privateProvider.getBalance(userAddress);
            const formatted = ethers.formatEther(balance);
            console.log(`✅ Private native balance: ${formatted} PAVEL`);
            return formatted;
          }
          
        } catch (privateErr) {
          console.error('❌ Private chain balance check failed:', privateErr);
          console.log('🔄 Falling back to direct balance check...');
          
          // Final fallback
          const fallbackBalance = await privateProvider.getBalance(userAddress);
          const fallbackFormatted = ethers.formatEther(fallbackBalance);
          console.log(`📊 Fallback private balance: ${fallbackFormatted} PAVEL`);
          return fallbackFormatted;
        }
      }
      
      // If no token address, get native PAVEL balance
      if (!tokenAddress) {
        console.log('🪙 Getting native PAVEL balance');
        const provider = chain === 'PUBLIC' ? publicProvider : privateProvider;
        if (!provider) {
          console.log(`❌ ${chain} provider not available`);
          return '0';
        }
        
        const balance = await provider.getBalance(userAddress);
        const formatted = ethers.formatEther(balance);
        console.log(`✅ Native balance: ${formatted} PAVEL`);
        return formatted;
      }
      
      // For ERC20 tokens, check if it's the deployment proxy registry
      if (tokenAddress.toLowerCase() === '0x75da1758161588fd2ccbfd23ab87f373b0f73c8f'.toLowerCase()) {
        console.log('🪙 Deployment proxy registry detected - this handles native PAVEL bridging');
        console.log('🔄 Getting native PAVEL balance for bridging');
        
        // For deployment proxy registry, we should get native PAVEL balance
        const provider = chain === 'PUBLIC' ? publicProvider : privateProvider;
        if (!provider) {
          console.log(`❌ ${chain} provider not available`);
          return '0';
        }
        
        const balance = await provider.getBalance(userAddress);
        const formatted = ethers.formatEther(balance);
        console.log(`✅ Native balance for bridging: ${formatted} PAVEL`);
        return formatted;
      }
      
      // For other ERC20 tokens, use contract balanceOf
      console.log(`🪙 Getting ERC20 token balance for: ${tokenAddress}`);
      const contract = getTokenContract(tokenAddress, chain);
      const balance = await contract.balanceOf(userAddress);
      const formatted = ethers.formatEther(balance);
      console.log(`✅ ERC20 balance: ${formatted}`);
      return formatted;
      
    } catch (err) {
      console.error(`❌ Failed to get balance on ${chain}:`, err);
      
      // Check if it's a contract not found error
      if (err.message.includes('missing revert data') || err.message.includes('CALL_EXCEPTION')) {
        console.log(`ℹ️ Token contract not found or invalid at ${tokenAddress} on ${chain} chain`);
        throw new Error(`Token contract not found or invalid at ${tokenAddress} on ${chain} chain`);
      }
      
      return '0';
    }
  };

  // Debug function to test balance directly
  const debugBalance = async (userAddress = account) => {
    if (!userAddress) {
      console.log('⚠️ No address provided for debug');
      return;
    }

    console.log('🔍 DEBUG BALANCE CHECK');
    console.log('========================');
    console.log(`Address: ${userAddress}`);
    
    try {
      // Test public provider
      if (publicProvider) {
        console.log('\n📡 Public Provider Test:');
        try {
          const pubBlock = await publicProvider.getBlockNumber();
          console.log(`Block number: ${pubBlock}`);
          
          const pubBalance = await publicProvider.getBalance(userAddress);
          const pubFormatted = ethers.formatEther(pubBalance);
          console.log(`Raw balance: ${pubBalance.toString()}`);
          console.log(`Formatted: ${pubFormatted} PAVEL`);
        } catch (pubErr) {
          console.error('❌ Public provider error:', pubErr.message);
        }
      } else {
        console.log('❌ Public provider not available');
      }
      
      // Test private provider
      if (privateProvider) {
        console.log('\n📡 Private Provider Test:');
        try {
          const privBlock = await privateProvider.getBlockNumber();
          console.log(`Block number: ${privBlock}`);
          
          const privBalance = await privateProvider.getBalance(userAddress);
          const privFormatted = ethers.formatEther(privBalance);
          console.log(`Raw balance: ${privBalance.toString()}`);
          console.log(`Formatted: ${privFormatted} PAVEL`);
        } catch (privErr) {
          console.error('❌ Private provider error:', privErr.message);
          console.log('ℹ️ Private chain may be temporarily unavailable');
        }
      } else {
        console.log('❌ Private provider not available');
      }
      
    } catch (error) {
      console.error('❌ Debug balance error:', error);
    }
  };

  const value = {
    account,
    publicProvider,
    privateProvider,
    connectWallet,
    disconnectWallet,
    bridgeToPrivate,
    mintToVault,
    getBalance,
    getContract,
    debugBalance,
    CHAINS,
    isConnecting,
    web3Error: error
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}
