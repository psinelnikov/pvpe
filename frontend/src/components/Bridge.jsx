import { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import Alert from './Alert';

export default function Bridge() {
  const {
    account,
    connectWallet,
    bridgeToPrivate,
    mintToVault,
    getBalance,
    publicProvider,
    CHAINS,
    isConnecting,
    web3Error
  } = useWeb3();

  const [tokenAddress, setTokenAddress] = useState('0x4Ad3F180D8c5fB1Cdfd6dbed5Cc1fFa5432d30F9');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('0x58037ac5dc543e19ec0756e1c9df4e8e1a0767cc');
  const [publicBalance, setPublicBalance] = useState('0.00');
  const [privateBalance, setPrivateBalance] = useState('0.00');
  const [vaultBalance, setVaultBalance] = useState('0.00');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tokenType, setTokenType] = useState('pavel');
  const [bridgeDirection, setBridgeDirection] = useState('toPrivate'); // 'toPrivate' or 'mintToVault'

  // Load balances when account changes or token address changes
  useEffect(() => {
    const loadBalances = async () => {
      if (account) {
        try {
          const pubBalance = await getBalance(tokenAddress, 'PUBLIC', account);
          const privBalance = await getBalance(tokenAddress, 'PRIVATE', account);
          // For vault balance, use the YieldVault contract address on private chain
          const vaultAddress = '0x7e5c367489A86DC1eb4A5D54F13c71d15eFA58af';
          const vaultBal = await getBalance(vaultAddress, 'PRIVATE', account);
          setPublicBalance(pubBalance);
          setPrivateBalance(privBalance);
          setVaultBalance(vaultBal);
        } catch (err) {
          console.error('Failed to load balances:', err);
          setPublicBalance('0.00');
          setPrivateBalance('0.00');
          setVaultBalance('0.00');
        }
      }
    };
    
    loadBalances();
  }, [account, tokenAddress, getBalance]);

  // Manual refresh function
  const refreshBalances = async () => {
    setIsRefreshing(true);
    try {
      if (account) {
        const pubBalance = await getBalance(tokenAddress, 'PUBLIC', account);
        const privBalance = await getBalance(tokenAddress, 'PRIVATE', account);
        // For vault balance, use the YieldVault contract address on private chain
        const vaultAddress = '0x7e5c367489A86DC1eb4A5D54F13c71d15eFA58af';
        const vaultBal = await getBalance(vaultAddress, 'PRIVATE', account);
        setPublicBalance(pubBalance);
        setPrivateBalance(privBalance);
        setVaultBalance(vaultBal);
      }
    } catch (err) {
      console.error('Failed to refresh balances:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!account) {
    return (
      <main>
        <div style={{maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem'}}>
          <h1 style={{fontSize: '1.75rem', fontWeight: '700', color: 'white', margin: '0 0 4px'}}>Bridge PAVEL</h1>
          <p style={{color: '#9ca3af', margin: '0 0 1.5rem'}}>Transfer PAVEL tokens between public and private chains</p>
          
          <div style={{maxWidth: '640px', margin: '0 auto'}}>
            <div style={{background: '#1f2937', borderRadius: '12px', border: '1px solid #374151', padding: '1.5rem', textAlign: 'center'}}>
              <h2 style={{fontSize: '1.25rem', fontWeight: '600', color: 'white', margin: '0 0 1rem'}}>Connect Wallet Required</h2>
              <p style={{color: '#6b7280', margin: '0 0 1.5rem'}}>Please connect your wallet to bridge PAVEL tokens</p>
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                style={{padding: '12px 24px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: isConnecting ? 'not-allowed' : 'pointer'}}
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
              {web3Error && (
                <div style={{marginTop: '1rem', padding: '12px', background: '#991b1b', border: '1px solid #dc2626', borderRadius: '8px', color: '#fca5a5', fontSize: '14px'}}>
                  {web3Error}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div style={{maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem'}}>

        {/* Header */}
        <h1 style={{fontSize: '1.75rem', fontWeight: '700', color: 'white', margin: '0 0 4px'}}>Bridge PAVEL</h1>
        <p style={{color: '#9ca3af', margin: '0 0 1.5rem'}}>Transfer PAVEL tokens between public and private chains</p>

        <div style={{maxWidth: '640px', margin: '0 auto'}}>
          <div style={{background: '#1f2937', borderRadius: '12px', border: '1px solid #374151', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>

            {/* Bridge Direction */}
            <div>
              <label style={{display: 'block', fontSize: '13px', fontWeight: '500', color: '#d1d5db', marginBottom: '8px'}}>Bridge Direction</label>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px'}}>
                <button 
                  onClick={() => setBridgeDirection('toPrivate')}
                  style={{padding: '10px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', background: bridgeDirection === 'toPrivate' ? '#4f46e5' : '#374151', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center'}}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
                  Bridge to Private Chain
                </button>
                <button 
                  onClick={() => setBridgeDirection('mintToVault')}
                  style={{padding: '10px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', background: bridgeDirection === 'mintToVault' ? '#4f46e5' : '#374151', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center'}}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20"></path></svg>
                  Mint to Vault
                </button>
              </div>
              {bridgeDirection === 'toPrivate' && (
                <div style={{padding: '10px 12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', borderRadius: '8px', fontSize: '12px', color: '#93c5fd'}}>
                  📡 Transfer tokens from public chain to private chain for privacy operations
                </div>
              )}
              {bridgeDirection === 'mintToVault' && (
                <div style={{padding: '10px 12px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', borderRadius: '8px', fontSize: '12px', color: '#86efac'}}>
                  💰 Mint corresponding tokens to the vault on public chain for liquidity
                </div>
              )}
            </div>

            {/* Chain Route */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
              <div style={{background: '#111827', borderRadius: '8px', padding: '12px 16px'}}>
                <p style={{fontSize: '11px', fontWeight: '500', color: '#6b7280', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>From · Public Chain</p>
                <p style={{fontSize: '14px', fontWeight: '600', color: 'white', margin: '0 0 2px'}}>Rayls Testnet</p>
                <p style={{fontSize: '12px', color: '#4b5563', margin: '0'}}>Chain ID: 7298919</p>
              </div>
              <div style={{background: '#111827', borderRadius: '8px', padding: '12px 16px'}}>
                <p style={{fontSize: '11px', fontWeight: '500', color: '#6b7280', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                  To · {bridgeDirection === 'toPrivate' ? 'Private Chain' : 'Vault Contract'}
                </p>
                <p style={{fontSize: '14px', fontWeight: '600', color: 'white', margin: '0 0 2px'}}>
                  {bridgeDirection === 'toPrivate' ? 'Rayls Privacy Node' : 'YieldVault Contract'}
                </p>
                <p style={{fontSize: '12px', color: '#4b5563', margin: '0'}}>
                  {bridgeDirection === 'toPrivate' ? 'Chain ID: 800005' : '0x7e5c367489A86DC1eb4A5D54F13c71d15eFA58af'}
                </p>
              </div>
            </div>

            {/* Balances */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
              <div style={{background: '#111827', borderRadius: '8px', padding: '12px 16px'}}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px'}}>
                  <p style={{fontSize: '11px', fontWeight: '500', color: '#6b7280', margin: '0', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Public Balance</p>
                  <button 
                    onClick={refreshBalances}
                    title="Refresh" 
                    style={{background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '14px', padding: '0', lineHeight: '1'}}
                  >
                    {isRefreshing ? '⟳' : '↻'}
                  </button>
                </div>
                <p style={{fontSize: '20px', fontWeight: '700', color: 'white', margin: '0 0 4px'}}>{publicBalance} PAVEL</p>
                <p style={{fontSize: '11px', color: '#4b5563', margin: '0', fontFamily: 'monospace'}}>{account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '0x5803...67cc'}</p>
              </div>
              <div style={{background: '#111827', borderRadius: '8px', padding: '12px 16px'}}>
                <p style={{fontSize: '11px', fontWeight: '500', color: '#6b7280', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Private Balance</p>
                <p style={{fontSize: '20px', fontWeight: '700', color: 'white', margin: '0 0 4px'}}>{privateBalance} PAVEL</p>
                <p style={{fontSize: '11px', color: '#4b5563', margin: '0', fontFamily: 'monospace'}}>{account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '0x5803...67cc'}</p>
              </div>
            </div>

            {/* Divider */}
            <div style={{height: '1px', background: '#374151'}}></div>

            {/* Token Type */}
            <div>
              <label style={{display: 'block', fontSize: '13px', fontWeight: '500', color: '#d1d5db', marginBottom: '8px'}}>Token Type</label>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px'}}>
                <button 
                  onClick={() => {setTokenType('pavel'); setTokenAddress('0x4Ad3F180D8c5fB1Cdfd6dbed5Cc1fFa5432d30F9');}}
                  style={{padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', background: tokenType === 'pavel' ? '#4f46e5' : '#374151', color: 'white', border: 'none', cursor: 'pointer'}}
                >
                  PAVEL Token (Default)
                </button>
                <button 
                  onClick={() => {setTokenType('yield'); setTokenAddress('0x3661E4536FCb41b9c4Fad67B78c3D218b811b0bD');}}
                  style={{padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', background: tokenType === 'yield' ? '#4f46e5' : '#374151', color: 'white', border: 'none', cursor: 'pointer'}}
                >
                  YieldToken
                </button>
              </div>
              <input 
                type="text" 
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                style={{width: '100%', background: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '9px 12px', color: 'white', fontSize: '13px', fontFamily: 'monospace', boxSizing: 'border-box', outline: 'none'}} 
                placeholder="0x... (ERC20 token address)"
              />
              {tokenType === 'pavel' && (
                <div style={{marginTop: '8px', padding: '10px 12px', background: 'rgba(20,83,45,0.4)', border: '1px solid #166534', borderRadius: '8px', fontSize: '12px', color: '#86efac'}}>
                  ✅ PAVEL Token selected — Balance: {publicBalance} PAVEL tokens on public chain
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label style={{display: 'block', fontSize: '13px', fontWeight: '500', color: '#d1d5db', marginBottom: '8px'}}>Amount (PAVEL)</label>
              <div style={{display: 'flex', gap: '8px'}}>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  step="0.01" 
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{flex: 1, background: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '9px 12px', color: 'white', fontSize: '13px', boxSizing: 'border-box', outline: 'none'}} 
                />
                <button 
                  onClick={() => setAmount(publicBalance)}
                  style={{padding: '9px 16px', background: '#374151', border: '1px solid #4b5563', borderRadius: '8px', color: 'white', fontSize: '13px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap'}}
                >
                  Max
                </button>
              </div>
              <p style={{fontSize: '12px', color: '#6b7280', margin: '6px 0 0'}}>Available: {publicBalance} PAVEL</p>
            </div>

            {/* Recipient - Only show for bridge to private chain */}
            {bridgeDirection === 'toPrivate' && (
              <div>
                <label style={{display: 'block', fontSize: '13px', fontWeight: '500', color: '#d1d5db', marginBottom: '8px'}}>Recipient Address (Private Chain)</label>
                <input 
                  type="text" 
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  style={{width: '100%', background: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '9px 12px', color: 'white', fontSize: '13px', fontFamily: 'monospace', boxSizing: 'border-box', outline: 'none'}} 
                  placeholder="0x..."
                />
              </div>
            )}

            {/* Vault Info - Only show for mint to vault */}
            {bridgeDirection === 'mintToVault' && (
              <div>
                <label style={{display: 'block', fontSize: '13px', fontWeight: '500', color: '#d1d5db', marginBottom: '8px'}}>Vault Information</label>
                <div style={{background: '#111827', borderRadius: '8px', padding: '12px 16px', border: '1px solid #374151'}}>
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px'}}>
                    <span style={{fontSize: '12px', color: '#6b7280', fontWeight: '500'}}>Vault Contract</span>
                    <span style={{fontSize: '12px', color: '#22c55e', fontWeight: '500'}}>✅ Active</span>
                  </div>
                  <p style={{fontSize: '13px', color: 'white', fontFamily: 'monospace', margin: '0 0 8px'}}>0x7e5c367489A86DC1eb4A5D54F13c71d15eFA58af</p>
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px'}}>
                    <span style={{fontSize: '12px', color: '#6b7280', fontWeight: '500'}}>Current Vault Balance</span>
                    <span style={{fontSize: '12px', color: 'white', fontWeight: '500'}}>{vaultBalance} PAVEL</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                    <span style={{fontSize: '12px', color: '#6b7280', fontWeight: '500'}}>Your Vault Share</span>
                    <span style={{fontSize: '12px', color: '#22c55e', fontWeight: '500'}}>0.00%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <button 
              disabled={!amount || (bridgeDirection === 'toPrivate' && !recipient) || isLoading}
              onClick={async () => {
                try {
                  setIsLoading(true);
                  setError('');
                  setSuccess('');
                  
                  if (bridgeDirection === 'toPrivate') {
                    // Bridge to private chain
                    const result = await bridgeToPrivate(tokenAddress, amount, recipient);
                    setSuccess(`Transaction successful! Hash: ${result.transactionHash}`);
                  } else {
                    // Mint to vault
                    const result = await mintToVault(tokenAddress, amount);
                    setSuccess(`Successfully minted ${amount} PAVEL to vault! Hash: ${result.transactionHash}`);
                  }
                  
                  // Reset form
                  setAmount('');
                  
                  // Refresh balances
                  if (account) {
                    const pubBalance = await getBalance(tokenAddress, 'PUBLIC', account);
                    const privBalance = await getBalance(tokenAddress, 'PRIVATE', account);
                    // For vault balance, use the YieldVault contract address on private chain
                    const vaultAddress = '0x7e5c367489A86DC1eb4A5D54F13c71d15eFA58af';
                    const vaultBal = await getBalance(vaultAddress, 'PRIVATE', account);
                    setPublicBalance(pubBalance);
                    setPrivateBalance(privBalance);
                    setVaultBalance(vaultBal);
                  }
                  
                } catch (err) {
                  setError(err.message || 'Transaction failed');
                } finally {
                  setIsLoading(false);
                }
              }}
              style={{width: '100%', background: (!amount || (bridgeDirection === 'toPrivate' && !recipient) || isLoading) ? '#3730a3' : '#4f46e5', color: '#a5b4fc', border: 'none', padding: '11px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: (!amount || (bridgeDirection === 'toPrivate' && !recipient) || isLoading) ? 'not-allowed' : 'pointer', opacity: (!amount || (bridgeDirection === 'toPrivate' && !recipient) || isLoading) ? 0.6 : 1}}
            >
              {isLoading ? 'Processing...' : (bridgeDirection === 'toPrivate' ? 'Bridge to Private Chain' : 'Mint to Vault')}
            </button>

            {/* Status Messages */}
            {error && (
              <div style={{padding: '12px', background: '#991b1b', border: '1px solid #dc2626', borderRadius: '8px', color: '#fca5a5', fontSize: '14px'}}>
                {error}
              </div>
            )}
            {success && (
              <div style={{padding: '12px', background: '#14532d', border: '1px solid #16a34a', borderRadius: '8px', color: '#86efac', fontSize: '14px'}}>
                {success}
              </div>
            )}

            {/* How it works */}
            <div style={{background: '#111827', borderRadius: '8px', padding: '14px 16px'}}>
              <p style={{fontSize: '12px', fontWeight: '600', color: '#9ca3af', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                How it works
              </p>
              {bridgeDirection === 'toPrivate' ? (
                <ol style={{margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px'}}>
                  <li style={{fontSize: '12px', color: '#6b7280'}}>Enter the PAVEL token contract address on the public chain</li>
                  <li style={{fontSize: '12px', color: '#6b7280'}}>Specify the amount to bridge (will be locked on public chain)</li>
                  <li style={{fontSize: '12px', color: '#6b7280'}}>Set the recipient address on the private chain</li>
                  <li style={{fontSize: '12px', color: '#6b7280'}}>Approve the transaction and wait for confirmation</li>
                  <li style={{fontSize: '12px', color: '#6b7280'}}>Tokens will appear on the private chain after processing</li>
                </ol>
              ) : (
                <ol style={{margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px'}}>
                  <li style={{fontSize: '12px', color: '#6b7280'}}>Enter the PAVEL token contract address on the public chain</li>
                  <li style={{fontSize: '12px', color: '#6b7280'}}>Specify the amount to mint to the vault contract</li>
                  <li style={{fontSize: '12px', color: '#6b7280'}}>Tokens will be minted directly to the YieldVault contract</li>
                  <li style={{fontSize: '12px', color: '#6b7280'}}>Vault balance increases and becomes available for lending</li>
                  <li style={{fontSize: '12px', color: '#6b7280'}}>You receive vault shares proportional to your contribution</li>
                </ol>
              )}
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
