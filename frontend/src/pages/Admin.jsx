import { useEffect, useState } from 'react';
import { api } from '../services/api';
import Loading from '../components/Loading';
import { formatDate } from '../utils/formatters';

export default function Admin() {
  const [apiKeys, setApiKeys] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [keys, logs] = await Promise.all([
        api.getApiKeys(),
        api.getAuditLog({ limit: 20 }),
      ]);
      setApiKeys(keys);
      setAuditLog(logs);
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
        <h1 style={{fontSize: '1.75rem', fontWeight: '700', color: 'white', margin: '0 0 4px'}}>Admin Panel</h1>
        <p style={{color: '#9ca3af', margin: '0 0 2rem'}}>System administration and API key management</p>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '1.5rem'}}>
          <div style={{background: '#1f2937', borderRadius: '12px', border: '1px solid #374151'}}>
            <h2 style={{fontSize: '1.25rem', fontWeight: '600', color: 'white', padding: '1.5rem', borderBottom: '1px solid #374151', margin: '0'}}>API Keys</h2>
            <div style={{padding: '1.5rem'}}>
              {apiKeys.length > 0 ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                  {apiKeys.map((key, i) => (
                    <div key={i} style={{background: '#111827', borderRadius: '8px', padding: '16px'}}>
                      <h3 style={{color: 'white', fontSize: '14px', fontWeight: '500', margin: '0 0 4px'}}>{key.name}</h3>
                      <p style={{color: '#6b7280', fontSize: '12px', margin: '0', fontFamily: 'monospace'}}>{key.key}</p>
                      <p style={{color: '#6b7280', fontSize: '12px', margin: '0'}}>{formatDate(key.createdAt)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{textAlign: 'center', padding: '2rem'}}>
                  <p style={{color: '#6b7280', margin: '0'}}>No API keys found</p>
                </div>
              )}
            </div>
          </div>
          <div style={{background: '#1f2937', borderRadius: '12px', border: '1px solid #374151'}}>
            <h2 style={{fontSize: '1.25rem', fontWeight: '600', color: 'white', padding: '1.5rem', borderBottom: '1px solid #374151', margin: '0'}}>Audit Log</h2>
            <div style={{padding: '1.5rem'}}>
              {auditLog.length > 0 ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                  {auditLog.map((log, i) => (
                    <div key={i} style={{background: '#111827', borderRadius: '8px', padding: '16px'}}>
                      <p style={{color: 'white', fontSize: '14px', margin: '0'}}>{log.action}</p>
                      <p style={{color: '#6b7280', fontSize: '12px', margin: '0'}}>{formatDate(log.timestamp)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{textAlign: 'center', padding: '2rem'}}>
                  <p style={{color: '#6b7280', margin: '0'}}>No audit entries found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
