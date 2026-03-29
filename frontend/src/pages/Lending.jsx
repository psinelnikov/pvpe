import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ArrowRight, Clock, Wallet, RefreshCw, CheckCircle, DollarSign, TrendingUp } from 'lucide-react';
import Alert from '../components/Alert';

export default function Lending() {
  const [depositAmount, setDepositAmount] = useState('');
  const [bankA, setBankA] = useState('');
  const [bankB, setBankB] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [status, setStatus] = useState({
    deposited: false,
    bridged: false,
    positionOpened: false,
    yieldReady: false,
    yieldAccrued: false,
    rebalanced: false,
    navUpdated: false,
  });
  const [navValue, setNavValue] = useState('0.00');

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const data = await api.getLendingStatus();
      setStatus(data.status);
      setNavValue(data.navValue);
    } catch (err) {
      console.error('Failed to load status:', err);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      showAlert('error', 'Please enter a valid deposit amount');
      return;
    }
    
    setLoading(true);
    try {
      await api.depositToVault({ amount: depositAmount, asset: 'USDC' });
      setStatus(prev => ({ ...prev, deposited: true }));
      showAlert('success', `Successfully deposited ${depositAmount} USDC to PublicVault`);
      setDepositAmount('');
    } catch (err) {
      showAlert('error', err.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBridge = async () => {
    setLoading(true);
    try {
      await api.waitForBridge();
      setStatus(prev => ({ ...prev, bridged: true }));
      showAlert('success', 'Assets successfully bridged to Privacy Node');
    } catch (err) {
      showAlert('error', err.message || 'Bridge failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPosition = async () => {
    if (!bankA || !bankB) {
      showAlert('error', 'Please select both banks');
      return;
    }
    
    setLoading(true);
    try {
      await api.openLendingPosition({ bankA, bankB });
      setStatus(prev => ({ ...prev, positionOpened: true }));
      showAlert('success', `Successfully opened lending position between ${bankA} and ${bankB}`);
    } catch (err) {
      showAlert('error', err.message || 'Failed to open position');
    } finally {
      setLoading(false);
    }
  };

  const handleWaitYield = async () => {
    setLoading(true);
    try {
      await api.waitForYieldAccrual();
      setStatus(prev => ({ ...prev, yieldReady: true }));
      showAlert('success', 'Yield has been accrued (1+ day period)');
    } catch (err) {
      showAlert('error', err.message || 'Yield accrual check failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAccrueYield = async () => {
    setLoading(true);
    try {
      await api.accrueYieldViaPolicy();
      setStatus(prev => ({ ...prev, yieldAccrued: true }));
      showAlert('success', 'Yield successfully accrued via policy');
    } catch (err) {
      showAlert('error', err.message || 'Failed to accrue yield');
    } finally {
      setLoading(false);
    }
  };

  const handleRebalance = async () => {
    setLoading(true);
    try {
      await api.runDailyRebalancer();
      setStatus(prev => ({ ...prev, rebalanced: true }));
      showAlert('success', 'Daily rebalancer executed successfully');
    } catch (err) {
      showAlert('error', err.message || 'Rebalancing failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyNAV = async () => {
    setLoading(true);
    try {
      const result = await api.verifyNAV();
      setStatus(prev => ({ ...prev, navUpdated: true }));
      setNavValue(result.navValue);
      showAlert('success', `NAV verified and updated: ${result.navValue}`);
    } catch (err) {
      showAlert('error', err.message || 'NAV verification failed');
    } finally {
      setLoading(false);
    }
  };

  const ActionCard = ({ number, title, description, icon: Icon, action, disabled, completed }) => null;
  return (
    <main>
      <div style={{maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem'}}>

        {/* Header */}
        <h1 style={{fontSize: '1.75rem', fontWeight: '700', color: 'white', margin: '0 0 4px'}}>Lending Protocol Actions</h1>
        <p style={{color: '#9ca3af', margin: '0 0 1.5rem'}}>Execute the lending workflow step by step</p>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onDismiss={() => setAlert(null)}
          />
        )}

        {/* NAV Card */}
        <div style={{background: '#1f2937', borderRadius: '12px', border: '1px solid #374151', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <div style={{width: '44px', height: '44px', borderRadius: '8px', background: 'rgba(30,64,175,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              <DollarSign style={{width: '20px', height: '20px', color: '#60a5fa'}} />
            </div>
            <div>
              <h3 style={{fontSize: '15px', fontWeight: '600', color: 'white', margin: '0 0 2px'}}>PublicVault NAV</h3>
              <p style={{fontSize: '13px', color: '#6b7280', margin: '0'}}>Current Net Asset Value</p>
            </div>
          </div>
          <div style={{textAlign: 'right'}}>
            <p style={{fontSize: '1.75rem', fontWeight: '700', color: 'white', margin: '0 0 2px'}}>${navValue}</p>
            <p style={{fontSize: '12px', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', margin: '0'}}>
              <TrendingUp style={{width: '13px', height: '13px'}} />
              Updated
            </p>
          </div>
        </div>

        {/* Steps */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '2px'}}>

          {/* Step 1 */}
          <div style={{background: '#1f2937', borderRadius: '10px 10px 0 0', border: '1px solid #374151', padding: '1.25rem 1.5rem'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem'}}>
              <div style={{width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                <Wallet style={{width: '16px', height: '16px', color: '#818cf8'}} />
              </div>
              <div style={{flex: 1}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <span style={{fontSize: '11px', fontFamily: 'monospace', color: '#4b5563'}}>#1</span>
                  <h3 style={{fontSize: '14px', fontWeight: '600', color: 'white', margin: '0'}}>Deposit USDC to PublicVault</h3>
                </div>
                <p style={{fontSize: '12px', color: '#6b7280', margin: '2px 0 0'}}>Deposit USDC tokens to the PublicVault on the public chain</p>
              </div>
              <button 
                onClick={handleDeposit}
                disabled={!depositAmount || loading}
                style={{padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', background: !depositAmount || loading ? '#374151' : '#4f46e5', color: !depositAmount || loading ? '#4b5563' : 'white', border: 'none', cursor: !depositAmount || loading ? 'not-allowed' : 'pointer', flexShrink: 0}}
              >
                {loading ? 'Processing...' : 'Execute'}
              </button>
            </div>
            <div style={{background: '#111827', borderRadius: '8px', padding: '12px 16px'}}>
              <label style={{display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '6px'}}>Deposit Amount (USDC)</label>
              <input 
                type="number" 
                placeholder="Enter amount..." 
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                style={{width: '100%', background: '#1f2937', border: '1px solid #374151', borderRadius: '6px', padding: '8px 12px', color: 'white', fontSize: '13px', boxSizing: 'border-box', outline: 'none'}}
              />
            </div>
          </div>

          {/* Step 2 */}
          <div style={{background: '#1f2937', borderRadius: '0', border: '1px solid #374151', borderTop: 'none', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '12px'}}>
            <div style={{width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              <ArrowRight style={{width: '16px', height: '16px', color: '#818cf8'}} />
            </div>
            <div style={{flex: 1}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{fontSize: '11px', fontFamily: 'monospace', color: '#4b5563'}}>#2</span>
                <h3 style={{fontSize: '14px', fontWeight: '600', color: 'white', margin: '0'}}>Wait for Bridge to Privacy Node</h3>
              </div>
              <p style={{fontSize: '12px', color: '#6b7280', margin: '2px 0 0'}}>Wait for assets to be bridged from public chain to privacy node</p>
            </div>
            <button 
              onClick={handleBridge}
              disabled={!status.deposited || loading}
              style={{padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', background: !status.deposited || loading ? '#374151' : '#4f46e5', color: !status.deposited || loading ? '#4b5563' : 'white', border: 'none', cursor: !status.deposited || loading ? 'not-allowed' : 'pointer', flexShrink: 0}}
            >
              {loading ? 'Processing...' : 'Execute'}
            </button>
          </div>

          {/* Step 3 */}
          <div style={{background: '#1f2937', borderRadius: '0', border: '1px solid #374151', borderTop: 'none', padding: '1.25rem 1.5rem'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem'}}>
              <div style={{width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                <Wallet style={{width: '16px', height: '16px', color: '#818cf8'}} />
              </div>
              <div style={{flex: 1}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <span style={{fontSize: '11px', fontFamily: 'monospace', color: '#4b5563'}}>#3</span>
                  <h3 style={{fontSize: '14px', fontWeight: '600', color: 'white', margin: '0'}}>Open Lending Position</h3>
                </div>
                <p style={{fontSize: '12px', color: '#6b7280', margin: '2px 0 0'}}>Open a lending position between two selected banks</p>
              </div>
              <button 
                onClick={handleOpenPosition}
                disabled={!status.bridged || loading}
                style={{padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', background: !status.bridged || loading ? '#374151' : '#4f46e5', color: !status.bridged || loading ? '#4b5563' : 'white', border: 'none', cursor: !status.bridged || loading ? 'not-allowed' : 'pointer', flexShrink: 0}}
              >
                {loading ? 'Processing...' : 'Execute'}
              </button>
            </div>
            <div style={{background: '#111827', borderRadius: '8px', padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
              <div>
                <label style={{display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '6px'}}>Bank A (Lender)</label>
                <select 
                  value={bankA}
                  onChange={(e) => setBankA(e.target.value)}
                  style={{width: '100%', background: '#1f2937', border: '1px solid #374151', borderRadius: '6px', padding: '8px 12px', color: 'white', fontSize: '13px', boxSizing: 'border-box', outline: 'none'}}
                >
                  <option value="">Select bank...</option>
                  <option value="bank_alpha">Bank Alpha</option>
                  <option value="bank_beta">Bank Beta</option>
                  <option value="bank_gamma">Bank Gamma</option>
                </select>
              </div>
              <div>
                <label style={{display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '6px'}}>Bank B (Borrower)</label>
                <select 
                  value={bankB}
                  onChange={(e) => setBankB(e.target.value)}
                  style={{width: '100%', background: '#1f2937', border: '1px solid #374151', borderRadius: '6px', padding: '8px 12px', color: 'white', fontSize: '13px', boxSizing: 'border-box', outline: 'none'}}
                >
                  <option value="">Select bank...</option>
                  <option value="bank_alpha">Bank Alpha</option>
                  <option value="bank_beta">Bank Beta</option>
                  <option value="bank_gamma">Bank Gamma</option>
                </select>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div style={{background: '#1f2937', borderRadius: '0', border: '1px solid #374151', borderTop: 'none', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '12px'}}>
            <div style={{width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              <CheckCircle style={{width: '16px', height: '16px', color: '#818cf8'}} />
            </div>
            <div style={{flex: 1}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{fontSize: '11px', fontFamily: 'monospace', color: '#4b5563'}}>#4</span>
                <h3 style={{fontSize: '14px', fontWeight: '600', color: 'white', margin: '0'}}>Accrue Yield via Policy</h3>
              </div>
              <p style={{fontSize: '12px', color: '#6b7280', margin: '2px 0 0'}}>Execute policy to accrue and claim yield</p>
            </div>
            <button 
              onClick={handleAccrueYield}
              disabled={!status.yieldReady || loading}
              style={{padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', background: !status.yieldReady || loading ? '#374151' : '#4f46e5', color: !status.yieldReady || loading ? '#4b5563' : 'white', border: 'none', cursor: !status.yieldReady || loading ? 'not-allowed' : 'pointer', flexShrink: 0}}
            >
              {loading ? 'Processing...' : 'Execute'}
            </button>
          </div>

          {/* Step 5 */}
          <div style={{background: '#1f2937', borderRadius: '0', border: '1px solid #374151', borderTop: 'none', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '12px'}}>
            <div style={{width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              <RefreshCw style={{width: '16px', height: '16px', color: '#818cf8'}} />
            </div>
            <div style={{flex: 1}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{fontSize: '11px', fontFamily: 'monospace', color: '#4b5563'}}>#5</span>
                <h3 style={{fontSize: '14px', fontWeight: '600', color: 'white', margin: '0'}}>Run Daily Rebalancer</h3>
              </div>
              <p style={{fontSize: '12px', color: '#6b7280', margin: '2px 0 0'}}>Execute daily rebalancing of positions</p>
            </div>
            <button 
              onClick={handleRebalance}
              disabled={!status.yieldAccrued || loading}
              style={{padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', background: !status.yieldAccrued || loading ? '#374151' : '#4f46e5', color: !status.yieldAccrued || loading ? '#4b5563' : 'white', border: 'none', cursor: !status.yieldAccrued || loading ? 'not-allowed' : 'pointer', flexShrink: 0}}
            >
              {loading ? 'Processing...' : 'Execute'}
            </button>
          </div>

          {/* Step 6 */}
          <div style={{background: '#1f2937', borderRadius: '0 0 10px 10px', border: '1px solid #374151', borderTop: 'none', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '12px'}}>
            <div style={{width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              <TrendingUp style={{width: '16px', height: '16px', color: '#818cf8'}} />
            </div>
            <div style={{flex: 1}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{fontSize: '11px', fontFamily: 'monospace', color: '#4b5563'}}>#6</span>
                <h3 style={{fontSize: '14px', fontWeight: '600', color: 'white', margin: '0'}}>Verify NAV Updated on PublicVault</h3>
              </div>
              <p style={{fontSize: '12px', color: '#6b7280', margin: '2px 0 0'}}>Verify that NAV has been updated on the public vault</p>
            </div>
            <button 
              onClick={handleVerifyNAV}
              disabled={!status.rebalanced || loading}
              style={{padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', background: !status.rebalanced || loading ? '#374151' : '#4f46e5', color: !status.rebalanced || loading ? '#4b5563' : 'white', border: 'none', cursor: !status.rebalanced || loading ? 'not-allowed' : 'pointer', flexShrink: 0}}
            >
              {loading ? 'Processing...' : 'Execute'}
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}
