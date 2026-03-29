import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { Wallet } from 'lucide-react';

const PolicyManager = () => {
  const { account, publicProvider, privateProvider, connectWallet } = useWeb3();
  const [selectedPolicy, setSelectedPolicy] = useState('conservative');
  const [newPolicy, setNewPolicy] = useState({
    name: '',
    description: '',
    type: 'BANK_POLICY'
  });

  // Swiss Bank Consortium policy data
  const policies = [
    {
      id: 'conservative',
      name: 'Conservative Bank',
      description: 'Low-risk lending policy for conservative banks',
      tier: 'CONSERVATIVE',
      status: 'ACTIVE',
      risk: 20,
      stats: {
        transactions: 156,
        volume: '780M USDC',
        compliance: 99.8,
        riskScore: 20.0
      },
      limits: {
        perTx: '5.0M USDC',
        daily: '20.0M USDC',
        approvalThreshold: '2.0M USDC',
        requiredApprovers: 'CFO, CRO',
        maxPositions: '10',
        maxExposure: '10.0M USDC'
      }
    },
    {
      id: 'standard',
      name: 'Standard Bank',
      description: 'Standard lending policy for typical banking operations',
      tier: 'STANDARD',
      status: 'ACTIVE',
      risk: 40,
      stats: {
        transactions: 342,
        volume: '2.1B USDC',
        compliance: 98.5,
        riskScore: 40.0
      },
      limits: {
        perTx: '10.0M USDC',
        daily: '50.0M USDC',
        approvalThreshold: '5.0M USDC',
        requiredApprovers: 'CRO',
        maxPositions: '25',
        maxExposure: '25.0M USDC'
      }
    },
    {
      id: 'institutional',
      name: 'Institutional Bank',
      description: 'High-capacity policy for institutional banking',
      tier: 'INSTITUTIONAL',
      status: 'ACTIVE',
      risk: 60,
      stats: {
        transactions: 89,
        volume: '3.4B USDC',
        compliance: 97.2,
        riskScore: 60.0
      },
      limits: {
        perTx: '50.0M USDC',
        daily: '200.0M USDC',
        approvalThreshold: '20.0M USDC',
        requiredApprovers: 'BOARD_MEMBER_1, BOARD_MEMBER_2',
        maxPositions: '50',
        maxExposure: '100.0M USDC'
      }
    },
    {
      id: 'rebalancer',
      name: 'Daily Rebalancer',
      description: 'Policy for automated daily rebalancing operations',
      tier: 'SYSTEM',
      status: 'ACTIVE',
      risk: 10,
      stats: {
        transactions: 45,
        volume: '12.3B USDC',
        compliance: 100,
        riskScore: 10.0
      },
      limits: {
        perTx: '100.0M USDC',
        daily: '500.0M USDC',
        approvalThreshold: '50.0M USDC',
        requiredApprovers: 'MULTISIG_1, MULTISIG_2, MULTISIG_3',
        maxPositions: '1',
        maxExposure: '500.0M USDC'
      }
    }
  ];

  const currentPolicy = policies.find(p => p.id === selectedPolicy);

  if (!account) {
    return (
      <main>
        <div style={{maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem'}}>
          <div style={{maxWidth: '640px', margin: '0 auto'}}>
            <div style={{background: '#1f2937', borderRadius: '12px', border: '1px solid #374151', padding: '1.5rem', textAlign: 'center'}}>
              <Wallet style={{width: '48px', height: '48px', color: '#fbbf24', margin: '0 auto 1rem'}} />
              <h2 style={{fontSize: '1.25rem', fontWeight: '600', color: 'white', margin: '0 0 1rem'}}>Connect Wallet Required</h2>
              <p style={{color: '#6b7280', margin: '0 0 1.5rem'}}>Please connect your wallet to manage Swiss Bank Consortium policies</p>
              <button
                onClick={connectWallet}
                style={{padding: '12px 24px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer'}}
              >
                Connect Wallet
              </button>
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
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px'}}>
          <h1 style={{fontSize: '1.75rem', fontWeight: '700', color: 'white', margin: '0'}}>Policy Manager</h1>
          <button 
            onClick={() => window.history.back()}
            style={{display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#6b7280', fontSize: '13px', fontWeight: '500', cursor: 'pointer', padding: '6px 10px', borderRadius: '6px'}}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path></svg>
            Back to TEE Demo
          </button>
        </div>
        <p style={{color: '#9ca3af', margin: '0 0 1.5rem'}}>TEE-enforced lending policies for private banking operations</p>

        <div style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>

          {/* Selected Policy: Conservative Bank */}
          <div style={{background: '#1f2937', borderRadius: '12px', border: '1px solid #374151', padding: '1.5rem'}}>
            <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem'}}>
              <div>
                <h2 style={{fontSize: '16px', fontWeight: '700', color: 'white', margin: '0 0 4px'}}>{currentPolicy.name}</h2>
                <p style={{fontSize: '13px', color: '#6b7280', margin: '0'}}>{currentPolicy.description}</p>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0}}>
                <span style={{fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: '#14532d', color: '#86efac', fontWeight: '500'}}>{currentPolicy.status}</span>
                <span style={{fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: currentPolicy.tier === 'CONSERVATIVE' ? '#1e3a5f' : currentPolicy.tier === 'STANDARD' ? '#2e1065' : currentPolicy.tier === 'INSTITUTIONAL' ? '#431407' : '#1f2937', color: currentPolicy.tier === 'CONSERVATIVE' ? '#93c5fd' : currentPolicy.tier === 'STANDARD' ? '#d8b4fe' : currentPolicy.tier === 'INSTITUTIONAL' ? '#fdba74' : '#9ca3af', fontWeight: '500', border: currentPolicy.tier === 'SYSTEM' ? '1px solid #374151' : 'none'}}>{currentPolicy.tier}</span>
                <span style={{fontSize: '12px', color: '#4ade80', fontWeight: '500'}}>Risk: {currentPolicy.risk}%</span>
              </div>
            </div>

            {/* Stats */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '1.25rem'}}>
              <div style={{background: '#111827', borderRadius: '8px', padding: '12px 14px'}}>
                <p style={{fontSize: '11px', color: '#6b7280', margin: '0 0 4px'}}>Total Transactions</p>
                <p style={{fontSize: '18px', fontWeight: '700', color: 'white', margin: '0'}}>{currentPolicy.stats.transactions}</p>
              </div>
              <div style={{background: '#111827', borderRadius: '8px', padding: '12px 14px'}}>
                <p style={{fontSize: '11px', color: '#6b7280', margin: '0 0 4px'}}>Total Volume</p>
                <p style={{fontSize: '18px', fontWeight: '700', color: 'white', margin: '0'}}>{currentPolicy.stats.volume}</p>
              </div>
              <div style={{background: '#111827', borderRadius: '8px', padding: '12px 14px'}}>
                <p style={{fontSize: '11px', color: '#6b7280', margin: '0 0 4px'}}>Compliance Score</p>
                <p style={{fontSize: '18px', fontWeight: '700', color: '#4ade80', margin: '0'}}>{currentPolicy.stats.compliance}%</p>
              </div>
              <div style={{background: '#111827', borderRadius: '8px', padding: '12px 14px'}}>
                <p style={{fontSize: '11px', color: '#6b7280', margin: '0 0 4px'}}>Risk Score</p>
                <p style={{fontSize: '18px', fontWeight: '700', color: 'white', margin: '0'}}>{currentPolicy.stats.riskScore}%</p>
              </div>
            </div>

            {/* Policy Limits */}
            <div style={{borderTop: '1px solid #374151', paddingTop: '1.25rem', marginBottom: '1.25rem'}}>
              <h3 style={{fontSize: '13px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px'}}>Policy Limits &amp; Approvals</h3>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 2rem'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px'}}><span style={{color: '#6b7280'}}>Per Transaction Limit</span><span style={{color: 'white', fontWeight: '500'}}>{currentPolicy.limits.perTx}</span></div>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px'}}><span style={{color: '#6b7280'}}>Required Approvers</span><span style={{color: 'white', fontWeight: '500'}}>{currentPolicy.limits.requiredApprovers}</span></div>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px'}}><span style={{color: '#6b7280'}}>Daily Limit</span><span style={{color: 'white', fontWeight: '500'}}>{currentPolicy.limits.daily}</span></div>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px'}}><span style={{color: '#6b7280'}}>Max Positions</span><span style={{color: 'white', fontWeight: '500'}}>{currentPolicy.limits.maxPositions}</span></div>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px'}}><span style={{color: '#6b7280'}}>Approval Threshold</span><span style={{color: 'white', fontWeight: '500'}}>{currentPolicy.limits.approvalThreshold}</span></div>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px'}}><span style={{color: '#6b7280'}}>Max Exposure</span><span style={{color: 'white', fontWeight: '500'}}>{currentPolicy.limits.maxExposure}</span></div>
              </div>
            </div>

            {/* Controls */}
            <div style={{borderTop: '1px solid #374151', paddingTop: '1.25rem', display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
              <button style={{padding: '7px 14px', borderRadius: '7px', fontSize: '13px', fontWeight: '500', background: '#713f12', color: '#fde68a', border: 'none', cursor: 'pointer'}}>Pause Policy</button>
              <button style={{padding: '7px 14px', borderRadius: '7px', fontSize: '13px', fontWeight: '500', background: '#1e3a5f', color: '#93c5fd', border: 'none', cursor: 'pointer'}}>Edit Limits</button>
              <button style={{padding: '7px 14px', borderRadius: '7px', fontSize: '13px', fontWeight: '500', background: '#2e1065', color: '#d8b4fe', border: 'none', cursor: 'pointer'}}>View Compliance Report</button>
              <button style={{padding: '7px 14px', borderRadius: '7px', fontSize: '13px', fontWeight: '500', background: '#431407', color: '#fdba74', border: 'none', cursor: 'pointer'}}>TEE Status</button>
            </div>
          </div>

          {/* All Policies */}
          <div style={{background: '#1f2937', borderRadius: '12px', border: '1px solid #374151', padding: '1.5rem'}}>
            <h3 style={{fontSize: '15px', fontWeight: '600', color: 'white', margin: '0 0 1rem'}}>Swiss Bank Consortium Policies</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '2px'}}>
              {policies.map((policy, index) => (
                <div 
                  key={policy.id}
                  onClick={() => setSelectedPolicy(policy.id)}
                  style={{
                    background: '#111827',
                    borderRadius: index === 0 ? '8px 8px 0 0' : index === policies.length - 1 ? '0 0 8px 8px' : '0',
                    border: policy.id === selectedPolicy ? '1px solid #4f46e5' : '1px solid #1f2937',
                    borderTop: index > 0 ? 'none' : undefined,
                    padding: '14px 16px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px'}}>
                    <div>
                      <p style={{fontSize: '14px', fontWeight: '600', color: 'white', margin: '0 0 2px'}}>{policy.name}</p>
                      <p style={{fontSize: '12px', color: '#6b7280', margin: '0'}}>{policy.description}</p>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0}}>
                      <span style={{fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: policy.tier === 'CONSERVATIVE' ? '#1e3a5f' : policy.tier === 'STANDARD' ? '#2e1065' : policy.tier === 'INSTITUTIONAL' ? '#431407' : '#1f2937', color: policy.tier === 'CONSERVATIVE' ? '#93c5fd' : policy.tier === 'STANDARD' ? '#d8b4fe' : policy.tier === 'INSTITUTIONAL' ? '#fdba74' : '#9ca3af', fontWeight: '500', border: policy.tier === 'SYSTEM' ? '1px solid #374151' : 'none'}}>{policy.tier}</span>
                      <span style={{fontSize: '12px', color: policy.risk <= 20 ? '#4ade80' : policy.risk <= 40 ? '#facc15' : '#f87171', fontWeight: '500'}}>Risk: {policy.risk}%</span>
                      <span style={{fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: '#14532d', color: '#86efac', fontWeight: '500'}}>{policy.status}</span>
                    </div>
                  </div>
                  <div style={{display: 'flex', gap: '16px'}}>
                    <span style={{fontSize: '12px', color: '#4b5563'}}>Limit: {policy.limits.perTx}</span>
                    <span style={{fontSize: '12px', color: '#4b5563'}}>Daily: {policy.limits.daily}</span>
                    <span style={{fontSize: '12px', color: '#4b5563'}}>Volume: {policy.stats.volume}</span>
                    <span style={{fontSize: '12px', color: '#4b5563'}}>Compliance: {policy.stats.compliance}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create Policy + System Info side by side */}
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem'}}>

            {/* Create New Policy */}
            <div style={{background: '#1f2937', borderRadius: '12px', border: '1px solid #374151', padding: '1.5rem'}}>
              <h3 style={{fontSize: '15px', fontWeight: '600', color: 'white', margin: '0 0 1rem'}}>Create New Policy</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                <div>
                  <label style={{display: 'block', fontSize: '12px', fontWeight: '500', color: '#9ca3af', marginBottom: '6px'}}>Policy Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter policy name" 
                    value={newPolicy.name}
                    onChange={(e) => setNewPolicy({...newPolicy, name: e.target.value})}
                    style={{width: '100%', background: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '13px', boxSizing: 'border-box', outline: 'none'}}
                  />
                </div>
                <div>
                  <label style={{display: 'block', fontSize: '12px', fontWeight: '500', color: '#9ca3af', marginBottom: '6px'}}>Description</label>
                  <textarea 
                    rows="3" 
                    placeholder="Describe your banking policy" 
                    value={newPolicy.description}
                    onChange={(e) => setNewPolicy({...newPolicy, description: e.target.value})}
                    style={{width: '100%', background: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '13px', boxSizing: 'border-box', outline: 'none', resize: 'vertical'}}
                  />
                </div>
                <div>
                  <label style={{display: 'block', fontSize: '12px', fontWeight: '500', color: '#9ca3af', marginBottom: '6px'}}>Policy Type</label>
                  <select 
                    value={newPolicy.type}
                    onChange={(e) => setNewPolicy({...newPolicy, type: e.target.value})}
                    style={{width: '100%', background: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '13px', boxSizing: 'border-box', outline: 'none'}}
                  >
                    <option value="BANK_POLICY">Bank Policy</option>
                    <option value="REBALANCER_POLICY">Rebalancer Policy</option>
                    <option value="COMPLIANCE_POLICY">Compliance Policy</option>
                  </select>
                </div>
                <button 
                  disabled={!newPolicy.name || !newPolicy.description}
                  style={{padding: '9px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', background: (!newPolicy.name || !newPolicy.description) ? '#312e81' : '#4f46e5', color: '#a5b4fc', border: 'none', cursor: (!newPolicy.name || !newPolicy.description) ? 'not-allowed' : 'pointer', opacity: (!newPolicy.name || !newPolicy.description) ? 0.6 : 1}}
                >
                  Create Policy
                </button>
              </div>
            </div>

            {/* System Information */}
            <div style={{background: '#1f2937', borderRadius: '12px', border: '1px solid #374151', padding: '1.5rem'}}>
              <h3 style={{fontSize: '15px', fontWeight: '600', color: 'white', margin: '0 0 1rem'}}>System Information</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px'}}><span style={{color: '#6b7280'}}>TEE Registry</span><span style={{color: '#4ade80'}}>✅ Active</span></div>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px'}}><span style={{color: '#6b7280'}}>ActionGate</span><span style={{color: '#4ade80'}}>✅ Enforcing</span></div>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px'}}><span style={{color: '#6b7280'}}>Policy Registry</span><span style={{color: '#4ade80'}}>✅ Synced</span></div>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px'}}><span style={{color: '#6b7280'}}>Privacy Node</span><span style={{color: '#4ade80'}}>✅ Connected</span></div>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px'}}><span style={{color: '#6b7280'}}>AgentPermit API</span><span style={{color: '#4ade80'}}>✅ Online</span></div>
                <div style={{height: '1px', background: '#374151', margin: '4px 0'}}></div>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px'}}><span style={{color: '#6b7280'}}>Last Rebalance</span><span style={{color: 'white', fontWeight: '500'}}>23:45 UTC</span></div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
};

export default PolicyManager;
