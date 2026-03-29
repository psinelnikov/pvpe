import { useEffect, useState } from 'react';
import { api } from '../services/api';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import { formatUSD } from '../utils/formatters';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getOrgStats();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <div className="text-red-400 py-12">{error}</div>;

  return (
    <main>
      <div style={{maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem'}}>
        <h1 style={{fontSize: '1.75rem', fontWeight: '700', color: 'white', margin: '0 0 4px'}}>Dashboard</h1>
        <p style={{color: '#9ca3af', margin: '0 0 2rem'}}>Overview of Rayls Vault operations and statistics</p>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onDismiss={() => setAlert(null)}
          />
        )}

        <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '1.5rem'}}>
          {[
            { title: 'Total Intents', value: stats?.intents || 0 },
            { title: 'Approved', value: stats?.approved || 0 },
            { title: 'Denied', value: stats?.denied || 0 },
            { title: 'Total Volume', value: formatUSD(stats?.totalVolume || 0) },
          ].map((card, i) => (
            <div key={i} style={{background: '#1f2937', borderRadius: '12px', border: '1px solid #374151', padding: '1.5rem'}}>
              <h3 style={{color: '#9ca3af', fontSize: '13px', fontWeight: '500', margin: '0 0 8px'}}>{card.title}</h3>
              <p style={{fontSize: '1.5rem', fontWeight: '700', color: 'white', margin: '0'}}>{card.value}</p>
            </div>
          ))}
        </div>

        {stats?.agentList?.length > 0 && (
          <div style={{background: '#1f2937', borderRadius: '12px', border: '1px solid #374151', padding: '1.5rem'}}>
            <h2 style={{fontSize: '1.25rem', fontWeight: '600', color: 'white', margin: '0 0 1rem'}}>Active Agents</h2>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              {stats.agentList.map((agent, i) => (
                <div key={i} style={{background: '#111827', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div>
                    <p style={{color: 'white', fontSize: '14px', fontWeight: '500', margin: '0 0 4px'}}>{agent.name || agent.agentId}</p>
                    <p style={{color: '#6b7280', fontSize: '12px', margin: '0'}}>{agent.walletAddr}</p>
                  </div>
                  <span style={{color: agent.active ? '#34d399' : '#6b7280', fontSize: '12px', fontWeight: '500'}}>
                    {agent.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
