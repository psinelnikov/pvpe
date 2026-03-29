import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useWeb3 } from '../contexts/Web3Context';
import PolicyManager from '../components/PolicyManager';
import PolicyExecutionEngine from '../utils/PolicyExecutionEngine';
import { 
  Shield, 
  Lock, 
  CheckCircle, 
  Settings, 
  Play, 
  RefreshCw, 
  Copy, 
  Code, 
  FileText, 
  Zap,
  Server,
  Key,
  Hash,
  Clock,
  Building2,
  TrendingUp,
  Users,
  AlertTriangle,
  Activity
} from 'lucide-react';
import Alert from '../components/Alert';

export default function TEEDemo() {
  const { account, publicProvider, privateProvider } = useWeb3();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [teeConfig, setTeeConfig] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [intent, setIntent] = useState(null);
  const [decision, setDecision] = useState(null);
  const [showPolicyManager, setShowPolicyManager] = useState(false);
  const [policyEngine, setPolicyEngine] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [activeBankPolicies, setActiveBankPolicies] = useState([]);

  useEffect(() => {
    loadTeeConfig();
    initializeBankingSystem();
  }, []);

  const initializeBankingSystem = async () => {
    try {
      // Initialize policy engine for Swiss Bank Consortium
      const engine = new PolicyExecutionEngine(
        privateProvider || publicProvider,
        null, // Will be set when wallet connects
        {} // Mock contracts for demo
      );
      
      await engine.initializeTEE();
      setPolicyEngine(engine);
      
      // Load Swiss Bank Consortium policies
      const bankPolicies = [
        {
          id: 'pol_conservative_bank',
          name: 'Conservative Bank',
          tier: 'CONSERVATIVE',
          perTxLimit: 5000000,
          dailyLimit: 20000000,
          approvalThreshold: 2000000,
          status: 'ACTIVE',
          performance: {
            totalTransactions: 156,
            totalVolume: '780M USDC',
            complianceScore: 99.8,
            riskScore: 0.2
          }
        },
        {
          id: 'pol_standard_bank',
          name: 'Standard Bank',
          tier: 'STANDARD',
          perTxLimit: 10000000,
          dailyLimit: 50000000,
          approvalThreshold: 5000000,
          status: 'ACTIVE',
          performance: {
            totalTransactions: 342,
            totalVolume: '2.1B USDC',
            complianceScore: 98.5,
            riskScore: 0.4
          }
        },
        {
          id: 'pol_institutional_bank',
          name: 'Institutional Bank',
          tier: 'INSTITUTIONAL',
          perTxLimit: 50000000,
          dailyLimit: 200000000,
          approvalThreshold: 20000000,
          status: 'ACTIVE',
          performance: {
            totalTransactions: 89,
            totalVolume: '3.4B USDC',
            complianceScore: 97.2,
            riskScore: 0.6
          }
        },
        {
          id: 'pol_rebalancer',
          name: 'Daily Rebalancer',
          tier: 'SYSTEM',
          perTxLimit: 100000000,
          dailyLimit: 500000000,
          approvalThreshold: 50000000,
          status: 'ACTIVE',
          performance: {
            totalTransactions: 45,
            totalVolume: '12.3B USDC',
            complianceScore: 100,
            riskScore: 0.1
          }
        }
      ];
      
      setActiveBankPolicies(bankPolicies);
      
      // Get system health
      const health = await engine.getSystemHealth();
      setSystemHealth(health);
      
    } catch (error) {
      console.error('Failed to initialize banking system:', error);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const loadTeeConfig = async () => {
    try {
      const config = await api.getSignerConfig();
      setTeeConfig(config);
    } catch (err) {
      console.error('Failed to load TEE config:', err);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    try {
      const result = await api.testTEEConnection({ endpoint: teeConfig?.endpoint });
      showAlert('success', `TEE Connection: ${result.status}`);
    } catch (err) {
      showAlert('error', err.message || 'Connection test failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigureTEE = async () => {
    const endpoint = document.getElementById('tee-endpoint').value;
    const codeHash = document.getElementById('tee-codehash').value;
    const mode = document.getElementById('tee-mode').value;

    setLoading(true);
    try {
      await api.updateSignerConfig({ mode, endpoint, codeHash });
      await loadTeeConfig();
      showAlert('success', 'TEE configuration updated successfully');
      setStep(2);
    } catch (err) {
      showAlert('error', err.message || 'Configuration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePolicy = async () => {
    const policyData = {
      policyId: 'pol_tee_demo',
      name: 'TEE Demo Policy',
      perTxLimit: document.getElementById('policy-per-tx').value,
      dailyLimit: document.getElementById('policy-daily').value,
      allowedAssets: ['USDC'],
      allowedChains: [99999],
      allowedPurposeCodes: ['vendor', 'inter_bank_lending', 'yield_accrual'],
      approvalRule: {
        thresholdAmount: document.getElementById('policy-threshold').value,
        required: 2,
        approvers: ['0x' + 'a'.repeat(40), '0x' + 'b'.repeat(40)],
      },
    };

    setLoading(true);
    try {
      const result = await api.createPolicy(policyData);
      setPolicy(result);
      showAlert('success', 'Policy created successfully');
      setStep(3);
    } catch (err) {
      showAlert('error', err.message || 'Policy creation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIntent = async () => {
    const intentData = {
      requestId: `tee_demo_${Date.now()}`,
      orgId: 'tee_demo_org',
      agentId: 'demo_agent',
      actionType: 'TRANSFER',
      asset: 'USDC',
      amount: document.getElementById('intent-amount').value,
      to: '0x' + 'c'.repeat(40),
      purposeCode: 'inter_bank_lending',
      chainId: 99999,
      expiry: Math.floor(Date.now() / 1000) + 3600,
      nonce: `tee_nonce_${Date.now()}`,
      createdAt: Math.floor(Date.now() / 1000),
    };

    setLoading(true);
    try {
      const result = await api.createIntent(intentData);
      setIntent(result);
      showAlert('success', 'Intent created successfully');
      setStep(4);
    } catch (err) {
      showAlert('error', err.message || 'Intent creation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGetDecision = async () => {
    if (!intent?.intentId) {
      showAlert('error', 'No intent ID available');
      return;
    }

    setLoading(true);
    try {
      const result = await api.decideIntent(intent.intentId, { policyId: policy?.policyId });
      setDecision(result);
      showAlert('success', `Decision: ${result.decisionStatus}`);
    } catch (err) {
      showAlert('error', err.message || 'Decision request failed');
    } finally {
      setLoading(false);
    }
  };

  const renderSwissBankOverview = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Swiss Bank Consortium TEE System</h2>
            <p className="text-gray-400 text-sm">Private vault lending with TEE-enforced policy compliance</p>
          </div>
        </div>

        {/* System Health Dashboard */}
        {systemHealth && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">TEE Registry</span>
                <span className="text-green-400 text-xs">✅ {systemHealth.teeRegistry}</span>
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">ActionGate</span>
                <span className="text-green-400 text-xs">✅ {systemHealth.actionGate}</span>
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Privacy Node</span>
                <span className="text-green-400 text-xs">✅ {systemHealth.privacyNode}</span>
              </div>
            </div>
          </div>
        )}

        {/* Bank Policy Overview */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Active Bank Policies
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            {activeBankPolicies.map((bankPolicy) => (
              <div key={bankPolicy.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-white font-medium">{bankPolicy.name}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${
                      bankPolicy.tier === 'CONSERVATIVE' ? 'bg-blue-900 text-blue-300' :
                      bankPolicy.tier === 'STANDARD' ? 'bg-purple-900 text-purple-300' :
                      bankPolicy.tier === 'INSTITUTIONAL' ? 'bg-orange-900 text-orange-300' :
                      'bg-gray-900 text-gray-300'
                    }`}>
                      {bankPolicy.tier}
                    </span>
                  </div>
                  <span className="text-green-400 text-xs">{bankPolicy.status}</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Per-Tx Limit:</span>
                    <span className="text-white">{(bankPolicy.perTxLimit / 1000000).toFixed(1)}M USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Daily Limit:</span>
                    <span className="text-white">{(bankPolicy.dailyLimit / 1000000).toFixed(0)}M USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Volume:</span>
                    <span className="text-white">{bankPolicy.performance.totalVolume}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Compliance:</span>
                    <span className="text-green-400">{bankPolicy.performance.complianceScore}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={() => setShowPolicyManager(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Shield className="w-4 h-4" />
            Manage Policies
          </button>
          <button
            onClick={() => setStep(1)}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
            TEE Demo
          </button>
        </div>
      </div>
    </div>
  );

  const renderBankingOperations = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Banking Operations</h2>
            <p className="text-gray-400 text-sm">Execute TEE-enforced lending operations</p>
          </div>
        </div>

        {/* Operation Types */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => executeBankingOperation('OPEN_POSITION')}
            disabled={loading}
            className="bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg transition-colors"
          >
            <Activity className="w-6 h-6 mb-2 mx-auto text-green-400" />
            <h3 className="font-medium mb-1">Open Position</h3>
            <p className="text-xs text-gray-400">Create new lending position</p>
          </button>
          
          <button
            onClick={() => executeBankingOperation('CLOSE_POSITION')}
            disabled={loading}
            className="bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg transition-colors"
          >
            <Lock className="w-6 h-6 mb-2 mx-auto text-red-400" />
            <h3 className="font-medium mb-1">Close Position</h3>
            <p className="text-xs text-gray-400">Close existing position</p>
          </button>
          
          <button
            onClick={() => executeBankingOperation('ACCRUE_YIELD')}
            disabled={loading}
            className="bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg transition-colors"
          >
            <TrendingUp className="w-6 h-6 mb-2 mx-auto text-yellow-400" />
            <h3 className="font-medium mb-1">Accrue Yield</h3>
            <p className="text-xs text-gray-400">Daily interest accrual</p>
          </button>
          
          <button
            onClick={() => executeBankingOperation('DAILY_REBALANCE')}
            disabled={loading}
            className="bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg transition-colors"
          >
            <RefreshCw className="w-6 h-6 mb-2 mx-auto text-blue-400" />
            <h3 className="font-medium mb-1">Daily Rebalance</h3>
            <p className="text-xs text-gray-400">Net settlement</p>
          </button>
        </div>

        {/* Recent Operations */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Operations
          </h3>
          <div className="space-y-2">
            <div className="bg-gray-700 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div>
                  <p className="text-white text-sm">Position Opened</p>
                  <p className="text-gray-400 text-xs">Standard Bank → Conservative Bank</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white text-sm">10M USDC</p>
                <p className="text-gray-400 text-xs">2 mins ago</p>
              </div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <div>
                  <p className="text-white text-sm">Yield Accrued</p>
                  <p className="text-gray-400 text-xs">Multiple positions</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white text-sm">450K USDC</p>
                <p className="text-gray-400 text-xs">15 mins ago</p>
              </div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <div>
                  <p className="text-white text-sm">Daily Rebalance</p>
                  <p className="text-gray-400 text-xs">Net settlement completed</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white text-sm">125M USDC</p>
                <p className="text-gray-400 text-xs">1 hour ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const executeBankingOperation = async (operation) => {
    if (!policyEngine) {
      showAlert('error', 'Policy engine not initialized');
      return;
    }
    
    setLoading(true);
    try {
      // Mock execution for demo
      const mockPolicy = activeBankPolicies[1]; // Standard Bank
      const mockContext = {
        lender: '0x' + 'a'.repeat(40),
        borrower: '0x' + 'b'.repeat(40),
        amount: 10000000, // 10M USDC
        rate: 50, // 50 bps
        operation,
        nonce: Date.now()
      };
      
      const result = await policyEngine.executeLendingOperation(mockPolicy, mockContext);
      showAlert('success', `${operation} executed successfully`);
    } catch (error) {
      showAlert('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showAlert('success', 'Copied to clipboard');
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <Settings className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Step 1: Configure TEE Signer</h2>
            <p className="text-gray-400 text-sm">Set up the Trusted Execution Environment signer</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Signer Mode</label>
            <select
              id="tee-mode"
              defaultValue={teeConfig?.mode || 'mock'}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="mock">Mock Mode (Testing)</option>
              <option value="fcc">FCC Mode (Production TEE)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">TEE Endpoint</label>
            <input
              id="tee-endpoint"
              type="text"
              defaultValue={teeConfig?.endpoint || 'http://localhost:8001'}
              placeholder="https://tee-service.example.com:8001"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">TEE Code Hash</label>
            <input
              id="tee-codehash"
              type="text"
              defaultValue={teeConfig?.codeHash || '0x' + 'a'.repeat(64)}
              placeholder="0x..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleTestConnection}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Test Connection
            </button>
            <button
              onClick={handleConfigureTEE}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Server className="w-4 h-4" />
              Configure TEE
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Step 2: Create TEE Policy</h2>
            <p className="text-gray-400 text-sm">Define the policy rules for TEE enforcement</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Per-Tx Limit (USDC)</label>
              <input
                id="policy-per-tx"
                type="text"
                defaultValue="1000000000000"
                placeholder="1000000"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Daily Limit (USDC)</label>
              <input
                id="policy-daily"
                type="text"
                defaultValue="10000000000000"
                placeholder="10000000"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Approval Threshold (USDC)</label>
            <input
              id="policy-threshold"
              type="text"
              defaultValue="500000000000"
              placeholder="500000"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="bg-gray-700 rounded-lg p-4 space-y-2">
            <div className="text-sm text-gray-400">
              <strong className="text-white">Allowed Assets:</strong> USDC
            </div>
            <div className="text-sm text-gray-400">
              <strong className="text-white">Allowed Chains:</strong> 99999 (Rayls Privacy Node)
            </div>
            <div className="text-sm text-gray-400">
              <strong className="text-white">Purpose Codes:</strong> vendor, inter_bank_lending, yield_accrual
            </div>
            <div className="text-sm text-gray-400">
              <strong className="text-white">Approvers Required:</strong> 2
            </div>
          </div>

          <button
            onClick={handleCreatePolicy}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            Create Policy
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Key className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Step 3: Create Intent</h2>
            <p className="text-gray-400 text-sm">Create a transfer intent for TEE evaluation</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Transfer Amount (USDC)</label>
            <input
              id="intent-amount"
              type="text"
              defaultValue="100000000000"
              placeholder="100000"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="bg-gray-700 rounded-lg p-4 space-y-2">
            <div className="text-sm text-gray-400">
              <strong className="text-white">Action Type:</strong> TRANSFER
            </div>
            <div className="text-sm text-gray-400">
              <strong className="text-white">Asset:</strong> USDC
            </div>
            <div className="text-sm text-gray-400">
              <strong className="text-white">Purpose Code:</strong> inter_bank_lending
            </div>
            <div className="text-sm text-gray-400">
              <strong className="text-white">Chain:</strong> 99999 (Rayls Privacy Node)
            </div>
          </div>

          <button
            onClick={handleCreateIntent}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Hash className="w-4 h-4" />
            Create Intent
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Zap className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Step 4: Get TEE Decision</h2>
            <p className="text-gray-400 text-sm">Request TEE-signed decision for the intent</p>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGetDecision}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
            Get TEE Decision
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg border border-green-500 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Step 5: TEE Decision Result</h2>
            <p className="text-gray-400 text-sm">TEE-signed decision with cryptographic proofs</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Decision Status</span>
              <span className={`text-sm font-bold ${decision?.decisionStatus === 'APPROVED' ? 'text-green-400' : decision?.decisionStatus === 'DENIED' ? 'text-red-400' : 'text-yellow-400'}`}>
                {decision?.decisionStatus}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Signer Type</span>
              <span className="text-sm text-white">{decision?.signerType}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Approvals Required</span>
              <span className="text-sm text-white">{decision?.approvalsRequired || 0}</span>
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400 font-medium flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Intent Hash
              </span>
              <button onClick={() => copyToClipboard(decision?.intentHash)} className="text-indigo-400 hover:text-indigo-300">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <code className="text-xs text-white font-mono break-all block">
              {decision?.intentHash}
            </code>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400 font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Policy Hash
              </span>
              <button onClick={() => copyToClipboard(decision?.policyHash)} className="text-indigo-400 hover:text-indigo-300">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <code className="text-xs text-white font-mono break-all block">
              {decision?.policyHash}
            </code>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400 font-medium flex items-center gap-2">
                <Code className="w-4 h-4" />
                Code Hash
              </span>
              <button onClick={() => copyToClipboard(decision?.codeHash)} className="text-indigo-400 hover:text-indigo-300">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <code className="text-xs text-white font-mono break-all block">
              {decision?.codeHash}
            </code>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400 font-medium flex items-center gap-2">
                <Lock className="w-4 h-4" />
                TEE Signature
              </span>
              <button onClick={() => copyToClipboard(decision?.teeSignature)} className="text-indigo-400 hover:text-indigo-300">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <code className="text-xs text-white font-mono break-all block">
              {decision?.teeSignature}
            </code>
          </div>

          {decision?.teeIdentity && (
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400 font-medium flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  TEE Identity
                </span>
                <button onClick={() => copyToClipboard(decision?.teeIdentity)} className="text-indigo-400 hover:text-indigo-300">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <code className="text-xs text-white font-mono break-all block">
                {decision?.teeIdentity}
              </code>
            </div>
          )}

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400 font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Expiry
              </span>
            </div>
            <p className="text-sm text-white">
              {new Date((decision?.expiry || 0) * 1000).toLocaleString()}
            </p>
          </div>

          {decision?.reasons && decision.reasons.length > 0 && (
            <div className="bg-gray-700 rounded-lg p-4">
              <span className="text-sm text-gray-400 font-medium block mb-2">Reasons</span>
              <ul className="space-y-1">
                {decision.reasons.map((reason, i) => (
                  <li key={i} className="text-sm text-white">• {reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => {
          setStep(1);
          setPolicy(null);
          setIntent(null);
          setDecision(null);
        }}
        className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Start New Demo
      </button>
    </div>
  );

  const steps = [
    { number: 1, title: 'Configure TEE', completed: step > 1, current: step === 1 },
    { number: 2, title: 'Create Policy', completed: step > 2, current: step === 2 },
    { number: 3, title: 'Create Intent', completed: step > 3, current: step === 3 },
    { number: 4, title: 'TEE Decision', completed: step > 4, current: step === 4 },
    { number: 5, title: 'Result', completed: step > 5, current: step === 5 },
  ];

  const bankingSections = [
    { number: 1, title: 'Overview', completed: false, current: showPolicyManager === false && step === 0 },
    { number: 2, title: 'Banking Ops', completed: false, current: showPolicyManager === false && step === -1 },
    { number: 3, title: 'Policy Mgr', completed: false, current: showPolicyManager === true },
  ];

  // Show policy manager modal
  if (showPolicyManager) {
    return (
      <div className="min-h-screen bg-gray-900">
        <PolicyManager />
      </div>
    );
  }

  // Show Swiss Bank Consortium overview when step = 0
  if (step === 0) {
    return (
      <main style={{paddingTop: '52px'}}>
        <div style={{maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem'}}>

          {/* Header */}
          <h1 style={{fontSize: '1.75rem', fontWeight: '700', color: 'white', margin: '0 0 4px'}}>Swiss Bank Consortium TEE System</h1>
          <p style={{color: '#9ca3af', margin: '0 0 2rem'}}>Private vault lending with TEE-enforced policy compliance</p>

          {/* Alert */}
          {alert && (
            <Alert
              type={alert.type}
              message={alert.message}
              onDismiss={() => setAlert(null)}
            />
          )}

          {/* Step Indicators */}
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', marginBottom: '1.5rem'}}>
            <div style={{width: '32px', height: '32px', borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700'}}>1</div>
            <div style={{width: '32px', height: '2px', background: '#374151'}}></div>
            <div style={{width: '32px', height: '32px', borderRadius: '50%', background: '#374151', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700'}}>2</div>
            <div style={{width: '32px', height: '2px', background: '#374151'}}></div>
            <div style={{width: '32px', height: '32px', borderRadius: '50%', background: '#374151', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700'}}>3</div>
          </div>

          {/* Tab Buttons */}
          <div style={{display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '2rem'}}>
            <button 
              onClick={() => setStep(0)}
              style={{padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', background: '#4f46e5', color: 'white', border: 'none', cursor: 'pointer'}}
            >
              Overview
            </button>
            <button 
              onClick={() => setStep(-1)}
              style={{padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', background: '#374151', color: '#d1d5db', border: 'none', cursor: 'pointer'}}
            >
              Banking Ops
            </button>
            <button 
              onClick={() => setShowPolicyManager(true)}
              style={{padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', background: '#374151', color: '#d1d5db', border: 'none', cursor: 'pointer'}}
            >
              Policy Mgr
            </button>
          </div>

          {/* Main Card */}
          <div style={{background: '#1f2937', borderRadius: '12px', border: '1px solid #374151', padding: '1.5rem'}}>

            {/* Status Row */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.5rem'}}>
              <div style={{background: '#111827', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <span style={{color: '#9ca3af', fontSize: '13px'}}>TEE Registry</span>
                <span style={{color: '#34d399', fontSize: '12px', fontWeight: '500'}}>✅ ACTIVE</span>
              </div>
              <div style={{background: '#111827', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <span style={{color: '#9ca3af', fontSize: '13px'}}>ActionGate</span>
                <span style={{color: '#34d399', fontSize: '12px', fontWeight: '500'}}>✅ ENFORCING</span>
              </div>
              <div style={{background: '#111827', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <span style={{color: '#9ca3af', fontSize: '13px'}}>Privacy Node</span>
                <span style={{color: '#34d399', fontSize: '12px', fontWeight: '500'}}>✅ CONNECTED</span>
              </div>
            </div>

            {/* Section Heading */}
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem'}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path></svg>
              <h3 style={{color: 'white', fontSize: '15px', fontWeight: '600', margin: '0'}}>Active Bank Policies</h3>
            </div>

            {/* Policy Cards Grid */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '1.5rem'}}>

              {/* Conservative Bank */}
              <div style={{background: '#111827', borderRadius: '8px', padding: '16px', border: '1px solid #1f2937'}}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <span style={{color: 'white', fontSize: '14px', fontWeight: '600'}}>Conservative Bank</span>
                    <span style={{fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: '#1e3a5f', color: '#93c5fd', fontWeight: '500'}}>CONSERVATIVE</span>
                  </div>
                  <span style={{color: '#34d399', fontSize: '11px', fontWeight: '600'}}>ACTIVE</span>
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px'}}>
                  <div style={{fontSize: '12px', color: '#6b7280'}}>Per-Tx Limit</div><div style={{fontSize: '12px', color: 'white', textAlign: 'right'}}>5.0M USDC</div>
                  <div style={{fontSize: '12px', color: '#6b7280'}}>Daily Limit</div><div style={{fontSize: '12px', color: 'white', textAlign: 'right'}}>20M USDC</div>
                  <div style={{fontSize: '12px', color: '#6b7280'}}>Total Volume</div><div style={{fontSize: '12px', color: 'white', textAlign: 'right'}}>780M USDC</div>
                  <div style={{fontSize: '12px', color: '#6b7280'}}>Compliance</div><div style={{fontSize: '12px', color: '#34d399', textAlign: 'right', fontWeight: '500'}}>99.8%</div>
                </div>
              </div>

              {/* Standard Bank */}
              <div style={{background: '#111827', borderRadius: '8px', padding: '16px', border: '1px solid #1f2937'}}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <span style={{color: 'white', fontSize: '14px', fontWeight: '600'}}>Standard Bank</span>
                    <span style={{fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: '#2e1065', color: '#d8b4fe', fontWeight: '500'}}>STANDARD</span>
                  </div>
                  <span style={{color: '#34d399', fontSize: '11px', fontWeight: '600'}}>ACTIVE</span>
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px'}}>
                  <div style={{fontSize: '12px', color: '#6b7280'}}>Per-Tx Limit</div><div style={{fontSize: '12px', color: 'white', textAlign: 'right'}}>10.0M USDC</div>
                  <div style={{fontSize: '12px', color: '#6b7280'}}>Daily Limit</div><div style={{fontSize: '12px', color: 'white', textAlign: 'right'}}>50M USDC</div>
                  <div style={{fontSize: '12px', color: '#6b7280'}}>Total Volume</div><div style={{fontSize: '12px', color: 'white', textAlign: 'right'}}>2.1B USDC</div>
                  <div style={{fontSize: '12px', color: '#6b7280'}}>Compliance</div><div style={{fontSize: '12px', color: '#34d399', textAlign: 'right', fontWeight: '500'}}>98.5%</div>
                </div>
              </div>

              {/* Institutional Bank */}
              <div style={{background: '#111827', borderRadius: '8px', padding: '16px', border: '1px solid #1f2937'}}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <span style={{color: 'white', fontSize: '14px', fontWeight: '600'}}>Institutional Bank</span>
                    <span style={{fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: '#431407', color: '#fdba74', fontWeight: '500'}}>INSTITUTIONAL</span>
                  </div>
                  <span style={{color: '#34d399', fontSize: '11px', fontWeight: '600'}}>ACTIVE</span>
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px'}}>
                  <div style={{fontSize: '12px', color: '#6b7280'}}>Per-Tx Limit</div><div style={{fontSize: '12px', color: 'white', textAlign: 'right'}}>50.0M USDC</div>
                  <div style={{fontSize: '12px', color: '#6b7280'}}>Daily Limit</div><div style={{fontSize: '12px', color: 'white', textAlign: 'right'}}>200M USDC</div>
                  <div style={{fontSize: '12px', color: '#6b7280'}}>Total Volume</div><div style={{fontSize: '12px', color: 'white', textAlign: 'right'}}>3.4B USDC</div>
                  <div style={{fontSize: '12px', color: '#6b7280'}}>Compliance</div><div style={{fontSize: '12px', color: '#34d399', textAlign: 'right', fontWeight: '500'}}>97.2%</div>
                </div>
              </div>

              {/* Daily Rebalancer */}
              <div style={{background: '#111827', borderRadius: '8px', padding: '16px', border: '1px solid #1f2937'}}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <span style={{color: 'white', fontSize: '14px', fontWeight: '600'}}>Daily Rebalancer</span>
                    <span style={{fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: '#1f2937', color: '#9ca3af', fontWeight: '500', border: '1px solid #374151'}}>SYSTEM</span>
                  </div>
                  <span style={{color: '#34d399', fontSize: '11px', fontWeight: '600'}}>ACTIVE</span>
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px'}}>
                  <div style={{fontSize: '12px', color: '#6b7280'}}>Per-Tx Limit</div><div style={{fontSize: '12px', color: 'white', textAlign: 'right'}}>100.0M USDC</div>
                  <div style={{fontSize: '12px', color: '#6b7280'}}>Daily Limit</div><div style={{fontSize: '12px', color: 'white', textAlign: 'right'}}>500M USDC</div>
                  <div style={{fontSize: '12px', color: '#6b7280'}}>Total Volume</div><div style={{fontSize: '12px', color: 'white', textAlign: 'right'}}>12.3B USDC</div>
                  <div style={{fontSize: '12px', color: '#6b7280'}}>Compliance</div><div style={{fontSize: '12px', color: '#34d399', textAlign: 'right', fontWeight: '500'}}>100%</div>
                </div>
              </div>

            </div>

            {/* Action Buttons */}
            <div style={{display: 'flex', gap: '12px'}}>
              <button 
                onClick={() => setShowPolicyManager(true)}
                style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#4f46e5', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer'}}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path></svg>
                Manage Policies
              </button>
              <button 
                onClick={() => setStep(1)}
                style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#374151', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer'}}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"></path></svg>
                TEE Demo
              </button>
            </div>

          </div>
        </div>
      </main>
    );
  }

  // Show banking operations when step = -1
  if (step === -1) {
    return (
      <main>
        <div style={{maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem'}}>

          {/* Header */}
          <h1 style={{fontSize: '1.75rem', fontWeight: '700', color: 'white', margin: '0 0 4px'}}>Banking Operations</h1>
          <p style={{color: '#9ca3af', margin: '0 0 1.5rem'}}>Execute TEE-enforced lending operations</p>

          {alert && (
            <Alert
              type={alert.type}
              message={alert.message}
              onDismiss={() => setAlert(null)}
            />
          )}

          <div style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>

            {/* Action Buttons */}
            <div style={{background: '#1f2937', borderRadius: '12px', border: '1px solid #374151', padding: '1.5rem'}}>
              <h2 style={{fontSize: '15px', fontWeight: '600', color: '#9ca3af', margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Actions</h2>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px'}}>

                <button 
                  onClick={() => executeBankingOperation('OPEN_POSITION')}
                  disabled={loading}
                  style={{background: '#111827', border: '1px solid #374151', borderRadius: '10px', padding: '16px 12px', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', textAlign: 'center', transition: 'background 0.15s'}}
                >
                  <div style={{display: 'flex', justifyContent: 'center', marginBottom: '8px'}}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"></path></svg>
                  </div>
                  <p style={{fontSize: '13px', fontWeight: '600', color: 'white', margin: '0 0 3px'}}>Open Position</p>
                  <p style={{fontSize: '11px', color: '#6b7280', margin: '0'}}>Create new lending position</p>
                </button>

                <button 
                  onClick={() => executeBankingOperation('CLOSE_POSITION')}
                  disabled={loading}
                  style={{background: '#111827', border: '1px solid #374151', borderRadius: '10px', padding: '16px 12px', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', textAlign: 'center'}}
                >
                  <div style={{display: 'flex', justifyContent: 'center', marginBottom: '8px'}}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </div>
                  <p style={{fontSize: '13px', fontWeight: '600', color: 'white', margin: '0 0 3px'}}>Close Position</p>
                  <p style={{fontSize: '11px', color: '#6b7280', margin: '0'}}>Close existing position</p>
                </button>

                <button 
                  onClick={() => executeBankingOperation('ACCRUE_YIELD')}
                  disabled={loading}
                  style={{background: '#111827', border: '1px solid #374151', borderRadius: '10px', padding: '16px 12px', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', textAlign: 'center'}}
                >
                  <div style={{display: 'flex', justifyContent: 'center', marginBottom: '8px'}}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 7h6v6"></path><path d="m22 7-8.5 8.5-5-5L2 17"></path></svg>
                  </div>
                  <p style={{fontSize: '13px', fontWeight: '600', color: 'white', margin: '0 0 3px'}}>Accrue Yield</p>
                  <p style={{fontSize: '11px', color: '#6b7280', margin: '0'}}>Daily interest accrual</p>
                </button>

                <button 
                  onClick={() => executeBankingOperation('DAILY_REBALANCE')}
                  disabled={loading}
                  style={{background: '#111827', border: '1px solid #374151', borderRadius: '10px', padding: '16px 12px', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', textAlign: 'center'}}
                >
                  <div style={{display: 'flex', justifyContent: 'center', marginBottom: '8px'}}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path></svg>
                  </div>
                  <p style={{fontSize: '13px', fontWeight: '600', color: 'white', margin: '0 0 3px'}}>Daily Rebalance</p>
                  <p style={{fontSize: '11px', color: '#6b7280', margin: '0'}}>Net settlement</p>
                </button>

              </div>
            </div>

            {/* Recent Operations */}
            <div style={{background: '#1f2937', borderRadius: '12px', border: '1px solid #374151', padding: '1.5rem'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem'}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>
                <h3 style={{fontSize: '15px', fontWeight: '600', color: 'white', margin: '0'}}>Recent Operations</h3>
              </div>

              <div style={{display: 'flex', flexDirection: 'column', gap: '2px'}}>

                <div style={{background: '#111827', borderRadius: '8px 8px 0 0', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <div style={{width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', flexShrink: 0}}></div>
                    <div>
                      <p style={{fontSize: '13px', fontWeight: '500', color: 'white', margin: '0 0 2px'}}>Position Opened</p>
                      <p style={{fontSize: '12px', color: '#6b7280', margin: '0'}}>Standard Bank → Conservative Bank</p>
                    </div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <p style={{fontSize: '13px', fontWeight: '600', color: 'white', margin: '0 0 2px'}}>10M USDC</p>
                    <p style={{fontSize: '11px', color: '#4b5563', margin: '0'}}>2 mins ago</p>
                  </div>
                </div>

                <div style={{background: '#111827', borderRadius: '0', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #1f2937'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <div style={{width: '8px', height: '8px', borderRadius: '50%', background: '#facc15', flexShrink: 0}}></div>
                    <div>
                      <p style={{fontSize: '13px', fontWeight: '500', color: 'white', margin: '0 0 2px'}}>Yield Accrued</p>
                      <p style={{fontSize: '12px', color: '#6b7280', margin: '0'}}>Multiple positions</p>
                    </div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <p style={{fontSize: '13px', fontWeight: '600', color: 'white', margin: '0 0 2px'}}>450K USDC</p>
                    <p style={{fontSize: '11px', color: '#4b5563', margin: '0'}}>15 mins ago</p>
                  </div>
                </div>

                <div style={{background: '#111827', borderRadius: '0 0 8px 8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #1f2937'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <div style={{width: '8px', height: '8px', borderRadius: '50%', background: '#60a5fa', flexShrink: 0}}></div>
                    <div>
                      <p style={{fontSize: '13px', fontWeight: '500', color: 'white', margin: '0 0 2px'}}>Daily Rebalance</p>
                      <p style={{fontSize: '12px', color: '#6b7280', margin: '0'}}>Net settlement completed</p>
                    </div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <p style={{fontSize: '13px', fontWeight: '600', color: 'white', margin: '0 0 2px'}}>125M USDC</p>
                    <p style={{fontSize: '11px', color: '#4b5563', margin: '0'}}>1 hour ago</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{paddingTop: '52px'}}>
      <div style={{maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem'}}>

        {/* Header */}
        <h1 style={{fontSize: '1.75rem', fontWeight: '700', color: 'white', margin: '0 0 4px'}}>TEE Policy Demo</h1>
        <p style={{color: '#9ca3af', margin: '0 0 1.5rem'}}>Demonstrate TEE policy creation and enforcement flow</p>

        {/* Alert */}
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onDismiss={() => setAlert(null)}
          />
        )}

        {/* Swiss Bank Hero Card */}
        <div style={{background: '#0f172a', borderRadius: '12px', border: '1px solid #1e3a5f', padding: '1.5rem', marginBottom: '1.5rem'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem'}}>
            <div style={{width: '44px', height: '44px', borderRadius: '8px', background: 'rgba(30,64,175,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 12h4"></path><path d="M10 8h4"></path><path d="M14 21v-3a2 2 0 0 0-4 0v3"></path><path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"></path><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"></path></svg>
            </div>
            <div>
              <h2 style={{fontSize: '16px', fontWeight: '700', color: 'white', margin: '0 0 2px'}}>Swiss Bank Consortium System</h2>
              <p style={{fontSize: '13px', color: '#9ca3af', margin: '0'}}>Private vault lending with TEE-enforced banking policies</p>
            </div>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '1.25rem'}}>
            <div style={{background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '12px 14px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px'}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path></svg>
                <span style={{fontSize: '13px', fontWeight: '600', color: '#4ade80'}}>4 Policy Tiers</span>
              </div>
              <p style={{fontSize: '11px', color: '#6b7280', margin: '0'}}>Conservative, Standard, Institutional, Rebalancer</p>
            </div>
            <div style={{background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '12px 14px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px'}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <span style={{fontSize: '13px', fontWeight: '600', color: '#60a5fa'}}>TEE-Enforced</span>
              </div>
              <p style={{fontSize: '11px', color: '#6b7280', margin: '0'}}>All operations require TEE-signed permits</p>
            </div>
            <div style={{background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '12px 14px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px'}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 7h6v6"></path><path d="m22 7-8.5 8.5-5-5L2 17"></path></svg>
                <span style={{fontSize: '13px', fontWeight: '600', color: '#c084fc'}}>18.5B USDC</span>
              </div>
              <p style={{fontSize: '11px', color: '#6b7280', margin: '0'}}>Total trading volume</p>
            </div>
          </div>

          <button 
            onClick={() => setStep(0)}
            style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#1d4ed8', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer'}}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 12h4"></path><path d="M10 8h4"></path><path d="M14 21v-3a2 2 0 0 0-4 0v3"></path><path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"></path><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"></path></svg>
            Enter Swiss Bank System
          </button>
        </div>

        {/* Step Indicators + Tabs */}
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '0'}}>
            <div style={{width: '30px', height: '30px', borderRadius: '50%', background: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700'}}>1</div>
            <div style={{width: '28px', height: '2px', background: '#374151'}}></div>
            <div style={{width: '30px', height: '30px', borderRadius: '50%', background: '#1f2937', color: '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', border: '1px solid #374151'}}>2</div>
            <div style={{width: '28px', height: '2px', background: '#374151'}}></div>
            <div style={{width: '30px', height: '30px', borderRadius: '50%', background: '#1f2937', color: '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', border: '1px solid #374151'}}>3</div>
            <div style={{width: '28px', height: '2px', background: '#374151'}}></div>
            <div style={{width: '30px', height: '30px', borderRadius: '50%', background: '#1f2937', color: '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', border: '1px solid #374151'}}>4</div>
            <div style={{width: '28px', height: '2px', background: '#374151'}}></div>
            <div style={{width: '30px', height: '30px', borderRadius: '50%', background: '#1f2937', color: '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', border: '1px solid #374151'}}>5</div>
          </div>

          <div style={{display: 'flex', gap: '6px', flexWrap: 'wrap'}}>
            <button 
              onClick={() => setStep(1)}
              style={{padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: '500', background: '#4f46e5', color: 'white', border: 'none', cursor: 'pointer'}}
            >
              Configure TEE
            </button>
            <button 
              disabled
              style={{padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: '500', background: '#1f2937', color: '#4b5563', border: 'none', cursor: 'not-allowed'}}
            >
              Create Policy
            </button>
            <button 
              disabled
              style={{padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: '500', background: '#1f2937', color: '#4b5563', border: 'none', cursor: 'not-allowed'}}
            >
              Create Intent
            </button>
            <button 
              disabled
              style={{padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: '500', background: '#1f2937', color: '#4b5563', border: 'none', cursor: 'not-allowed'}}
            >
              TEE Decision
            </button>
            <button 
              disabled
              style={{padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: '500', background: '#1f2937', color: '#4b5563', border: 'none', cursor: 'not-allowed'}}
            >
              Result
            </button>
          </div>
        </div>

        {/* Step 1 Card */}
        <div style={{background: '#1f2937', borderRadius: '12px', border: '1px solid #374151', padding: '1.5rem'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem'}}>
            <div style={{width: '44px', height: '44px', borderRadius: '8px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </div>
            <div>
              <h2 style={{fontSize: '15px', fontWeight: '700', color: 'white', margin: '0 0 2px'}}>Step 1: Configure TEE Signer</h2>
              <p style={{fontSize: '13px', color: '#6b7280', margin: '0'}}>Set up the Trusted Execution Environment signer</p>
            </div>
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
            <div>
              <label style={{display: 'block', fontSize: '12px', fontWeight: '500', color: '#9ca3af', marginBottom: '6px'}}>Signer Mode</label>
              <select 
                defaultValue={teeConfig?.mode || 'mock'}
                style={{width: '100%', background: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '9px 12px', color: 'white', fontSize: '13px', boxSizing: 'border-box', outline: 'none'}}
              >
                <option value="mock">Mock Mode (Testing)</option>
                <option value="fcc">FCC Mode (Production TEE)</option>
              </select>
            </div>
            <div>
              <label style={{display: 'block', fontSize: '12px', fontWeight: '500', color: '#9ca3af', marginBottom: '6px'}}>TEE Endpoint</label>
              <input 
                type="text" 
                defaultValue={teeConfig?.endpoint || 'http://localhost:8001'}
                placeholder="https://tee-service.example.com:8001" 
                style={{width: '100%', background: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '9px 12px', color: 'white', fontSize: '13px', fontFamily: 'monospace', boxSizing: 'border-box', outline: 'none'}}
              />
            </div>
            <div>
              <label style={{display: 'block', fontSize: '12px', fontWeight: '500', color: '#9ca3af', marginBottom: '6px'}}>TEE Code Hash</label>
              <input 
                type="text" 
                defaultValue={teeConfig?.codeHash || '0x' + 'a'.repeat(64)}
                placeholder="0x..." 
                style={{width: '100%', background: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '9px 12px', color: 'white', fontSize: '13px', fontFamily: 'monospace', boxSizing: 'border-box', outline: 'none'}}
              />
            </div>
            <div style={{display: 'flex', gap: '10px'}}>
              <button 
                onClick={handleTestConnection}
                disabled={loading}
                style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', background: '#374151', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer'}}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path></svg>
                Test Connection
              </button>
              <button 
                onClick={handleConfigureTEE}
                disabled={loading}
                style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', background: '#4f46e5', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer'}}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"></rect><rect width="20" height="8" x="2" y="14" rx="2" ry="2"></rect><line x1="6" x2="6.01" y1="6" y2="6"></line><line x1="6" x2="6.01" y1="18" y2="18"></line></svg>
                Configure TEE
              </button>
            </div>
          </div>
        </div>

        {/* Render other steps based on current step */}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {decision && step === 4 && setStep(5)}
        {step === 5 && renderStep5()}

      </div>
    </main>
  );
}
