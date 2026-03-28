import { useState, useEffect } from 'react';
import { api } from '../services/api';
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
  Clock
} from 'lucide-react';
import Alert from '../components/Alert';

export default function TEEDemo() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [teeConfig, setTeeConfig] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [intent, setIntent] = useState(null);
  const [decision, setDecision] = useState(null);

  useEffect(() => {
    loadTeeConfig();
  }, []);

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

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">TEE Policy Demo</h1>
      <p className="text-gray-400 mb-8">Demonstrate TEE policy creation and enforcement flow</p>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onDismiss={() => setAlert(null)}
        />
      )}

      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s.number} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  s.completed
                    ? 'bg-green-500 text-white'
                    : s.current
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {s.completed ? <CheckCircle className="w-4 h-4" /> : s.number}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${s.completed ? 'bg-green-500' : 'bg-gray-700'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center mb-8">
        <div className="flex gap-2">
          {steps.map((s) => (
            <button
              key={s.number}
              onClick={() => s.completed || s.current ? setStep(s.number) : null}
              disabled={!s.completed && !s.current}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                s.current
                  ? 'bg-indigo-600 text-white'
                  : s.completed
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
      {decision && step === 4 && setStep(5)}
      {step === 5 && renderStep5()}
    </div>
  );
}
