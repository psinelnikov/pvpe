import { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { formatUSD } from '../utils/formatters';
import Alert from './Alert';
import LoadingSpinner from './Loading';

export default function Bridge() {
  const {
    account,
    connectWallet,
    bridgeToPrivate,
    getBalance,
    debugBalance,
    publicProvider,
    CHAINS,
    isConnecting,
    error: web3Error,
  } = useWeb3();

  // Default to PAVEL token contract address (what was transferred)
  const [tokenAddress, setTokenAddress] = useState('0x4Ad3F180D8c5fB1Cdfd6dbed5Cc1fFa5432d30F9');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [publicBalance, setPublicBalance] = useState('0');
  const [privateBalance, setPrivateBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tokenInfo, setTokenInfo] = useState(null);
  const [isRecipientControlled, setIsRecipientControlled] = useState(false);

  // Auto-set recipient when account connects or when component first renders with account
  useEffect(() => {
    if (account) {
      console.log('🔧 Auto-setting recipient to account:', account);
      setRecipient(account);
    }
  }, [account]);

  // Also set recipient immediately if account is already available
  useEffect(() => {
    if (account && !recipient) {
      console.log('🔧 Setting recipient (immediate):', account);
      setRecipient(account);
    }
  }, [account, recipient]);

  // Load balances when account changes (no token address needed for native USDr)
  useEffect(() => {
    if (account && publicProvider) {
      // Small delay to ensure provider is fully ready
      const timer = setTimeout(() => {
        loadBalances();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [account, publicProvider]);

  // Also load balances when token address changes (for ERC20 tokens)
  useEffect(() => {
    if (account && tokenAddress && publicProvider) {
      loadBalances();
    }
  }, [tokenAddress]);

  const loadBalances = async () => {
    if (!account) {
      console.log('⚠️ Cannot load balances - missing account');
      return;
    }

    setIsRefreshing(true);
    console.log('🔄 Loading balances...');
    console.log(`📍 Account: ${account}`);
    console.log(`🪙 Token: ${tokenAddress || 'Native USDr'}`);

    try {
      let pubBalance = '0';
      let privBalance = '0';
      
      // Load public chain balance
      try {
        pubBalance = await getBalance(tokenAddress, 'PUBLIC', account);
        console.log(`💰 Public balance: ${pubBalance}`);
      } catch (pubErr) {
        console.error('❌ Failed to load public balance:', pubErr.message);
        setError(`Failed to load public balance: ${pubErr.message}`);
      }
      
      // Load private chain balance (don't fail if this doesn't work)
      try {
        privBalance = await getBalance(tokenAddress, 'PRIVATE', account);
        console.log(`💰 Private balance: ${privBalance}`);
      } catch (privErr) {
        console.warn('⚠️ Failed to load private balance:', privErr.message);
        console.log('ℹ️ Private chain may be temporarily unavailable');
        // Don't set error for private chain failures
      }
      
      // Debug state updates
      console.log('🔄 Updating state...');
      console.log(`Before update - publicBalance: ${publicBalance}`);
      
      setPublicBalance(pubBalance);
      setPrivateBalance(privBalance);
      
      // Force a re-render check
      setTimeout(() => {
        console.log(`After update - publicBalance should be: ${pubBalance}`);
        console.log(`After update - privateBalance should be: ${privBalance}`);
      }, 100);
      
      // Clear previous errors if public balance was successful
      if (pubBalance !== '0') {
        setError('');
      }
      
    } catch (err) {
      console.error('❌ Failed to load balances:', err);
      setError(`Failed to load balances: ${err.message}`);
      setPublicBalance('0');
      setPrivateBalance('0');
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadTokenInfo = async () => {
    if (!tokenAddress) return;

    try {
      // This would require adding token info methods to Web3Context
      console.log('🔍 Loading token info for:', tokenAddress);
      // For now, just set basic info
      setTokenInfo({
        address: tokenAddress,
        symbol: 'USDC', // Default assumption
        name: 'USD Coin',
      });
    } catch (err) {
      console.error('❌ Failed to load token info:', err);
    }
  };

  const handleConnect = async () => {
    const connected = await connectWallet();
    if (connected) {
      setRecipient(account);
    }
  };

  const handleBridge = async () => {
    if (!account) {
      setError('Please connect your wallet first');
      return;
    }

    if (!amount || !recipient) {
      setError('Please fill in amount and recipient');
      return;
    }

    if (parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (parseFloat(amount) > parseFloat(publicBalance)) {
      setError('Insufficient balance on public chain');
      return;
    }

    // For native USDr bridging, we need special handling
    if (!tokenAddress) {
      setError('Native USDr bridging requires the bridge contract address. Please use the deployment proxy registry: 0x75Da1758161588FD2ccbFd23AB87f373b0f73c8F');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');
    setTxHash('');

    try {
      const hash = await bridgeToPrivate(tokenAddress, amount, recipient);
      setTxHash(hash);
      setSuccess(`Bridge transaction successful! Hash: ${hash}`);
      
      // Reload balances after successful bridge
      setTimeout(loadBalances, 2000);
      
      // Reset form
      setAmount('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxAmount = () => {
    setAmount(publicBalance);
  };

  if (!account) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Connect Wallet to Bridge</h2>
          <p className="text-gray-400 mb-6">
            Connect your wallet to bridge USDr tokens from the public Rayls chain to the private chain.
          </p>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
          {web3Error && (
            <Alert message={web3Error} type="error" className="mt-4" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6">Bridge USDr to Private Chain</h2>
        
        {/* Chain Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-1">From (Public Chain)</h3>
            <p className="text-white font-medium">{CHAINS.PUBLIC.chainName}</p>
            <p className="text-sm text-gray-400">Chain ID: {parseInt(CHAINS.PUBLIC.chainId, 16)}</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-1">To (Private Chain)</h3>
            <p className="text-white font-medium">{CHAINS.PRIVATE.chainName}</p>
            <p className="text-sm text-gray-400">Chain ID: {parseInt(CHAINS.PRIVATE.chainId, 16)}</p>
          </div>
        </div>

        {/* Balances */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-400">Public Chain Balance</h3>
              <button
                onClick={() => {
                  console.log('🔘 Manual refresh clicked');
                  console.log(`Current publicBalance: ${publicBalance}`);
                  loadBalances();
                }}
                disabled={isRefreshing}
                className="text-gray-400 hover:text-white disabled:opacity-50"
                title="Refresh balances"
              >
                {isRefreshing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  '↻'
                )}
              </button>
            </div>
            <p className="text-xl font-bold text-white">
              {formatUSD(publicBalance)} USDr
            </p>
            {/* Debug rendering */}
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-yellow-400 mt-1">
                Raw: {publicBalance}
              </p>
            )}
            {account && (
              <p className="text-xs text-gray-400 mt-1">Account: {account.slice(0, 6)}...{account.slice(-4)}</p>
            )}
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Private Chain Balance</h3>
            <p className="text-xl font-bold text-white">
              {formatUSD(privateBalance)} USDr
            </p>
            {/* Debug rendering */}
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-yellow-400 mt-1">
                Raw: {privateBalance}
              </p>
            )}
            {account && (
              <p className="text-xs text-gray-400 mt-1">Account: {account.slice(0, 6)}...{account.slice(-4)}</p>
            )}
          </div>
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-600">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Debug Info</h3>
            <div className="text-xs text-gray-500 space-y-1">
              <p>Account: {account || 'Not connected'}</p>
              <p>Token Address: {tokenAddress || 'Native USDr'}</p>
              <p>Recipient: {recipient || 'Not set'}</p>
              <p>Public RPC: {CHAINS.PUBLIC.rpcUrls[0]}</p>
              <p>Private RPC: {CHAINS.PRIVATE.rpcUrls[0]}</p>
            </div>
            <button
              onClick={() => debugBalance && debugBalance()}
              className="mt-3 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
            >
              Debug Balance
            </button>
          </div>
        )}

        {/* Bridge Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Token Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTokenAddress('0x4Ad3F180D8c5fB1Cdfd6dbed5Cc1fFa5432d30F9')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  tokenAddress === '0x4Ad3F180D8c5fB1Cdfd6dbed5Cc1fFa5432d30F9'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                PAVEL Token (Default)
              </button>
              <button
                type="button"
                onClick={() => setTokenAddress('0x3661E4536FCb41b9c4Fad67B78c3D218b811b0bD')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  tokenAddress === '0x3661E4536FCb41b9c4Fad67B78c3D218b811b0bD'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                YieldToken
              </button>
            </div>
            
            {tokenAddress && (
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Token Address
                </label>
                <input
                  type="text"
                  value={tokenAddress || ''}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  onBlur={loadTokenInfo}
                  placeholder="0x... (ERC20 token address)"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
            
            {tokenAddress === '0x4Ad3F180D8c5fB1Cdfd6dbed5Cc1fFa5432d30F9' && (
              <div className="mt-2 p-3 bg-green-900 rounded-lg text-sm text-green-300">
                ✅ PAVEL Token selected - Your current tokens
                <br />
                <small>Balance: 20 PAVEL tokens on public chain</small>
              </div>
            )}
            
            {tokenAddress === '0x3661E4536FCb41b9c4Fad67B78c3D218b811b0bD' && (
              <div className="mt-2 p-3 bg-blue-900 rounded-lg text-sm text-blue-300">
                🔄 YieldToken selected - For yield vault operations
                <br />
                <small>Bridge to private chain for yield generation</small>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount (USDr)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleMaxAmount}
                disabled={!publicBalance || parseFloat(publicBalance) <= 0}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 border border-gray-600 rounded-lg text-white font-medium transition-colors"
              >
                Max
              </button>
            </div>
            {publicBalance && parseFloat(publicBalance) > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Available: {formatUSD(publicBalance)} USDr
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Recipient Address (Private Chain)
            </label>
            <input
              type="text"
              value={recipient || ''}
              onChange={(e) => {
                setRecipient(e.target.value);
                setIsRecipientControlled(true);
              }}
              onFocus={() => setIsRecipientControlled(true)}
              onBlur={() => setIsRecipientControlled(false)}
              placeholder="0x... (Recipient address on private chain)"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Debug button state */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-2 bg-gray-900 rounded text-xs text-gray-400">
              <p>Button Debug:</p>
              <p>isLoading: {String(isLoading)}</p>
              <p>amount: "{String(amount)}" (empty: {String(!amount)})</p>
              <p>recipient: "{String(recipient)}" (empty: {String(!recipient)})</p>
              <p>publicBalance: {String(publicBalance)}</p>
              <p>Button enabled: {String(!isLoading && amount && recipient)}</p>
            </div>
          )}

          <button
            onClick={handleBridge}
            disabled={isLoading || !amount || !recipient}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Bridging...
              </>
            ) : (
              'Bridge to Private Chain'
            )}
          </button>
        </div>

        {/* Status Messages */}
        {error && <Alert message={error} type="error" className="mt-4" />}
        {success && <Alert message={success} type="success" className="mt-4" />}

        {/* Transaction Hash */}
        {txHash && (
          <div className="mt-4 p-4 bg-gray-700 rounded-lg">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Transaction Hash</h3>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-gray-400 break-all">{txHash}</code>
              <button
                onClick={() => navigator.clipboard.writeText(txHash)}
                className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs text-white transition-colors"
              >
                Copy
              </button>
            </div>
            <a
              href={`${CHAINS.PUBLIC.blockExplorerUrls[0]}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block"
            >
              View on Explorer →
            </a>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
          <h3 className="text-sm font-medium text-gray-300 mb-2">How it works</h3>
          <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
            <li>Enter the USDr token contract address on the public chain</li>
            <li>Specify the amount to bridge (will be locked on public chain)</li>
            <li>Set the recipient address on the private chain</li>
            <li>Approve the transaction and wait for confirmation</li>
            <li>Tokens will appear on the private chain after processing</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
