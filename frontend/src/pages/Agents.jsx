import { useEffect, useState } from 'react';
import { api } from '../services/api';
import Loading from '../components/Loading';

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await api.getAgents();
      setAgents(data);
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
        <h1 style={{fontSize: '1.75rem', fontWeight: '700', color: 'white', margin: '0 0 4px'}}>Agents</h1>
        <p style={{color: '#9ca3af', margin: '0 0 2rem'}}>Manage and monitor Rayls Vault agents</p>
        <div style={{background: '#1f2937', borderRadius: '12px', border: '1px solid #374151', padding: '1.5rem'}}>
          <div style={{padding: '1.5rem'}}>
            {agents.length > 0 ? (
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                {agents.map((agent, i) => (
                  <div key={i} style={{background: '#111827', borderRadius: '8px', padding: '16px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                      <h3 style={{color: 'white', fontSize: '14px', fontWeight: '500', margin: '0'}}>{agent.name || agent.agentId}</h3>
                      <span style={{color: agent.active ? '#34d399' : '#6b7280', fontSize: '12px', fontWeight: '500'}}>
                        {agent.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p style={{color: '#6b7280', fontSize: '12px', margin: '0'}}>{agent.walletAddr}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{textAlign: 'center', padding: '2rem'}}>
                <p style={{color: '#6b7280', margin: '0'}}>No agents found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
