import { useEffect, useState } from 'react';
import { api } from '../services/api';
import Loading from '../components/Loading';
import { formatUSD } from '../utils/formatters';

export default function Policies() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const data = await api.getPolicies();
      setPolicies(data);
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
        <h1 style={{fontSize: '1.75rem', fontWeight: '700', color: 'white', margin: '0 0 4px'}}>Policies</h1>
        <p style={{color: '#9ca3af', margin: '0 0 2rem'}}>Manage lending and compliance policies</p>
        <div style={{background: '#1f2937', borderRadius: '12px', border: '1px solid #374151', padding: '1.5rem'}}>
          <div style={{padding: '1.5rem'}}>
            {policies.length > 0 ? (
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                {policies.map((policy, i) => (
                  <div key={i} style={{background: '#111827', borderRadius: '8px', padding: '16px', border: '1px solid #1f2937'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                      <h3 style={{color: 'white', fontSize: '14px', fontWeight: '500', margin: '0'}}>{policy.name}</h3>
                    </div>
                    <p style={{color: '#6b7280', fontSize: '12px', margin: '0 0 8px'}}>{policy.policyId}</p>
                    <div style={{display: 'flex', gap: '12px', fontSize: '12px', color: '#6b7280'}}>
                      <span>Limit: {policy.perTxLimit}</span>
                      <span>Daily: {policy.dailyLimit}</span>
                      <span>Status: {policy.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{textAlign: 'center', padding: '2rem'}}>
                <p style={{color: '#6b7280', margin: '0'}}>No policies found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
