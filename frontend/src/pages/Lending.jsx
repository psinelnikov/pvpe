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
    yieldAccrued: false,
    yieldClaimed: false,
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

  const handleWaitForBridge = async () => {
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

  const handleWaitForYield = async () => {
    setLoading(true);
    try {
      await api.waitForYieldAccrual();
      setStatus(prev => ({ ...prev, yieldAccrued: true }));
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
      setStatus(prev => ({ ...prev, yieldClaimed: true }));
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

  const ActionCard = ({ number, title, description, icon: Icon, action, disabled, completed }) => (
    <div className={`bg-gray-800 rounded-lg border ${completed ? 'border-green-500' : 'border-gray-700'} p-6 relative`}>
      {completed && (
        <div className="absolute top-4 right-4">
          <CheckCircle className="w-6 h-6 text-green-500" />
        </div>
      )}
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${completed ? 'bg-green-500/20' : 'bg-indigo-500/20'}`}>
          <Icon className={`w-5 h-5 ${completed ? 'text-green-400' : 'text-indigo-400'}`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-500">#{number}</span>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
      </div>
      <button
        onClick={action}
        disabled={disabled || loading || completed}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
          completed
            ? 'bg-green-500/20 text-green-400 cursor-default'
            : disabled
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
      >
        {loading ? 'Processing...' : completed ? 'Completed' : 'Execute'}
      </button>
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">Lending Protocol Actions</h1>
      <p className="text-gray-400 mb-8">Execute the lending workflow step by step</p>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onDismiss={() => setAlert(null)}
        />
      )}

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">PublicVault NAV</h3>
              <p className="text-sm text-gray-400">Current Net Asset Value</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">${navValue}</p>
            <p className="text-sm text-green-400 flex items-center justify-end gap-1">
              <TrendingUp className="w-4 h-4" />
              Updated
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <ActionCard
          number={1}
          title="Deposit USDC to PublicVault"
          description="Deposit USDC tokens to the PublicVault on the public chain"
          icon={Wallet}
          disabled={!depositAmount}
          completed={status.deposited}
          action={handleDeposit}
        />
        <div className="bg-gray-800/50 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-400 mb-2">Deposit Amount (USDC)</label>
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="Enter amount..."
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <ActionCard
          number={2}
          title="Wait for Bridge to Privacy Node"
          description="Wait for the assets to be bridged from public chain to privacy node"
          icon={ArrowRight}
          disabled={!status.deposited}
          completed={status.bridged}
          action={handleWaitForBridge}
        />

        <ActionCard
          number={3}
          title="Open Lending Position"
          description="Open a lending position between two selected banks"
          icon={Wallet}
          disabled={!status.bridged}
          completed={status.positionOpened}
          action={handleOpenPosition}
        />
        <div className="bg-gray-800/50 rounded-lg p-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Bank A (Lender)</label>
            <select
              value={bankA}
              onChange={(e) => setBankA(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select bank...</option>
              <option value="bank_alpha">Bank Alpha</option>
              <option value="bank_beta">Bank Beta</option>
              <option value="bank_gamma">Bank Gamma</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Bank B (Borrower)</label>
            <select
              value={bankB}
              onChange={(e) => setBankB(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select bank...</option>
              <option value="bank_alpha">Bank Alpha</option>
              <option value="bank_beta">Bank Beta</option>
              <option value="bank_gamma">Bank Gamma</option>
            </select>
          </div>
        </div>

        <ActionCard
          number={4}
          title="Wait for Yield Accrual"
          description="Wait for yield to accrue (minimum 1 day period)"
          icon={Clock}
          disabled={!status.positionOpened}
          completed={status.yieldAccrued}
          action={handleWaitForYield}
        />

        <ActionCard
          number={5}
          title="Accrue Yield via Policy"
          description="Execute policy to accrue and claim yield"
          icon={CheckCircle}
          disabled={!status.yieldAccrued}
          completed={status.yieldClaimed}
          action={handleAccrueYield}
        />

        <ActionCard
          number={6}
          title="Run Daily Rebalancer"
          description="Execute daily rebalancing of positions"
          icon={RefreshCw}
          disabled={!status.yieldClaimed}
          completed={status.rebalanced}
          action={handleRebalance}
        />

        <ActionCard
          number={7}
          title="Verify NAV Updated on PublicVault"
          description="Verify that NAV has been updated on the public vault"
          icon={TrendingUp}
          disabled={!status.rebalanced}
          completed={status.navUpdated}
          action={handleVerifyNAV}
        />
      </div>
    </div>
  );
}
