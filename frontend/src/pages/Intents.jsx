import { useEffect, useState } from 'react';
import { api } from '../services/api';
import Loading from '../components/Loading';
import { formatUSD, getStatusColor, getStatusLabel } from '../utils/formatters';

export default function Intents() {
  const [intents, setIntents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntents();
  }, []);

  const loadIntents = async () => {
    try {
      setLoading(true);
      const data = await api.getIntents({ limit: 50 });
      setIntents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <main>
      <div style={{maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem'}}>
        <h1 style={{fontSize: '1.75rem', fontWeight: '700', color: 'white', margin: '0 0 4px'}}>Intents</h1>
        <p style={{color: '#9ca3af', margin: '0 0 2rem'}}>View and manage transaction intents</p>
        <div style={{background: '#1f2937', borderRadius: '12px', border: '1px solid #374151', padding: '1.5rem'}}>
          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{background: '#111827'}}>
                  <th style={{padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase'}}>ID</th>
                  <th style={{padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase'}}>Agent</th>
                  <th style={{padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase'}}>Amount</th>
                  <th style={{padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase'}}>Purpose</th>
                  <th style={{padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase'}}>Status</th>
                </tr>
              </thead>
              <tbody>
                {intents.length > 0 ? (
                  intents.map((intent, i) => (
                    <tr key={i} style={{borderBottom: '1px solid #374151'}}>
                      <td style={{padding: '12px 16px', fontSize: '14px', color: 'white'}}>{intent.intentId?.slice(0, 8)}...</td>
                      <td style={{padding: '12px 16px', fontSize: '14px', color: 'white'}}>{intent.agentId}</td>
                      <td style={{padding: '12px 16px', fontSize: '14px', color: 'white'}}>{intent.amount}</td>
                      <td style={{padding: '12px 16px', fontSize: '14px', color: 'white'}}>{intent.purposeCode}</td>
                      <td style={{padding: '12px 16px'}}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: intent.decisionStatus === 'APPROVED' ? '#065f46' : intent.decisionStatus === 'PENDING' ? '#1e3a8a' : '#7f1d1d',
                          color: intent.decisionStatus === 'APPROVED' ? '#34d399' : intent.decisionStatus === 'PENDING' ? '#60a5fa' : '#f87171'
                        }}>
                          {intent.decisionStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{padding: '12px 16px', fontSize: '14px', color: 'white', textAlign: 'center'}}>No intents found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
