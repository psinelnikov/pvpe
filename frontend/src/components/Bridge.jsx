import { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import Alert from './Alert';

export default function Bridge() {
  const {
    account,
    connectWallet,
    bridgeToPrivate,
    getBalance,
    publicProvider,
    CHAINS,
    isConnecting,
    error: web3Error,
  } = useWeb3();

  const [tokenAddress, setTokenAddress] = useState('0x4Ad3F180D8c5fB1Cdfd6dbed5Cc1fFa5432d30F9');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('0x58037ac5dc543e19ec0756e1c9df4e8e1a0767cc');
  const [publicBalance, setPublicBalance] = useState('9.99');
  const [privateBalance, setPrivateBalance] = useState('0.00');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tokenType, setTokenType] = useState('pavel');

  if (!account) {
    return (
      <main>
        <div style={{maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem'}}>
          <h1 style={{fontSize: '1.75rem', fontWeight: '700', color: 'white', margin: '0 0 4px'}}>Bridge USDr</h1>
          <p style={{color: '#9ca3af', margin: '0 0 1.5rem'}}>Transfer USDr tokens between public and private chains</p>
          
          <div style={{maxWidth: '640px', margin: '0 auto'}}>
            <div style={{background: '#1f2937', borderRadius: '12px', border: '1px solid #374151', padding: '1.5rem', textAlign: 'center'}}>
              <h2 style={{fontSize: '1.25rem', fontWeight: '600', color: 'white', margin: '0 0 1rem'}}>Connect Wallet Required</h2>
              <p style={{color: '#6b7280', margin: '0 0 1.5rem'}}>Please connect your wallet to bridge USDr tokens</p>
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
        <h1 style={{fontSize: '1.75rem', fontWeight: '700', color: 'white', margin: '0 0 4px'}}>Bridge USDr</h1>
        <p style={{color: '#9ca3af', margin: '0 0 1.5rem'}}>Transfer USDr tokens between public and private chains</p>

        <div style={{maxWidth: '640px', margin: '0 auto'}}>
          <div style={{background: '#1f2937', borderRadius: '12px', border: '1px solid #374151', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>

            {/* Chain Route */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
              <div style={{background: '#111827', borderRadius: '8px', padding: '12px 16px'}}>
                <p style={{fontSize: '11px', fontWeight: '500', color: '#6b7280', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>From · Public Chain</p>
                <p style={{fontSize: '14px', fontWeight: '600', color: 'white', margin: '0 0 2px'}}>Rayls Testnet</p>
                <p style={{fontSize: '12px', color: '#4b5563', margin: '0'}}>Chain ID: 7298919</p>
              </div>
              <div style={{background: '#111827', borderRadius: '8px', padding: '12px 16px'}}>
                <p style={{fontSize: '11px', fontWeight: '500', color: '#6b7280', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>To · Private Chain</p>
                <p style={{fontSize: '14px', fontWeight: '600', color: 'white', margin: '0 0 2px'}}>Rayls Privacy Node</p>
                <p style={{fontSize: '12px', color: '#4b5563', margin: '0'}}>Chain ID: 800005</p>
              </div>
            </div>

            {/* Balances */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
              <div style={{background: '#111827', borderRadius: '8px', padding: '12px 16px'}}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px'}}>
                  <p style={{fontSize: '11px', fontWeight: '500', color: '#6b7280', margin: '0', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Public Balance</p>
                  <button 
                    onClick={() => setIsRefreshing(!isRefreshing)}
                    title="Refresh" 
                    style={{background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '14px', padding: '0', lineHeight: '1'}}
                  >
                    {isRefreshing ? '⟳' : '↻'}
                  </button>
                </div>
                <p style={{fontSize: '20px', fontWeight: '700', color: 'white', margin: '0 0 4px'}}>{publicBalance} USDr</p>
                <p style={{fontSize: '11px', color: '#4b5563', margin: '0', fontFamily: 'monospace'}}>{account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '0x5803...67cc'}</p>
              </div>
              <div style={{background: '#111827', borderRadius: '8px', padding: '12px 16px'}}>
                <p style={{fontSize: '11px', fontWeight: '500', color: '#6b7280', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Private Balance</p>
                <p style={{fontSize: '20px', fontWeight: '700', color: 'white', margin: '0 0 4px'}}>{privateBalance} USDr</p>
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
                  ✅ PAVEL Token selected — Balance: 20 PAVEL tokens on public chain
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label style={{display: 'block', fontSize: '13px', fontWeight: '500', color: '#d1d5db', marginBottom: '8px'}}>Amount (USDr)</label>
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
              <p style={{fontSize: '12px', color: '#6b7280', margin: '6px 0 0'}}>Available: {publicBalance} USDr</p>
            </div>

            {/* Recipient */}
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

            {/* Submit */}
            <button 
              disabled={!amount || !recipient || isLoading}
              onClick={() => {
                // Handle bridge logic here
                console.log('Bridging', { amount, recipient, tokenAddress });
              }}
              style={{width: '100%', background: (!amount || !recipient || isLoading) ? '#3730a3' : '#4f46e5', color: '#a5b4fc', border: 'none', padding: '11px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: (!amount || !recipient || isLoading) ? 'not-allowed' : 'pointer', opacity: (!amount || !recipient || isLoading) ? 0.6 : 1}}
            >
              {isLoading ? 'Processing...' : 'Bridge to Private Chain'}
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
              <p style={{fontSize: '12px', fontWeight: '600', color: '#9ca3af', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>How it works</p>
              <ol style={{margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <li style={{fontSize: '12px', color: '#6b7280'}}>Enter the USDr token contract address on the public chain</li>
                <li style={{fontSize: '12px', color: '#6b7280'}}>Specify the amount to bridge (will be locked on public chain)</li>
                <li style={{fontSize: '12px', color: '#6b7280'}}>Set the recipient address on the private chain</li>
                <li style={{fontSize: '12px', color: '#6b7280'}}>Approve the transaction and wait for confirmation</li>
                <li style={{fontSize: '12px', color: '#6b7280'}}>Tokens will appear on the private chain after processing</li>
              </ol>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
