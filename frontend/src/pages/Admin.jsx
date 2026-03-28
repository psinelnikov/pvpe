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
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Admin Panel</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold text-white p-6 border-b border-gray-700">API Keys</h2>
          <div className="p-6">
            {apiKeys.length > 0 ? (
              <div className="space-y-3">
                {apiKeys.map((key, i) => (
                  <div key={i} className="p-4 bg-gray-700 rounded-lg">
                    <h3 className="text-white font-medium">{key.name}</h3>
                    <p className="text-gray-400 text-sm font-mono">{key.key}</p>
                    <p className="text-gray-400 text-sm">{formatDate(key.createdAt)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No API keys</p>
            )}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold text-white p-6 border-b border-gray-700">Audit Log</h2>
          <div className="p-6">
            {auditLog.length > 0 ? (
              <div className="space-y-3">
                {auditLog.map((log, i) => (
                  <div key={i} className="p-3 bg-gray-700 rounded-lg text-sm">
                    <p className="text-white">{log.action}</p>
                    <p className="text-gray-400 text-xs">{formatDate(log.timestamp)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No audit entries</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
