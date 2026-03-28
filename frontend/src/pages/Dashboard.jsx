import { useEffect, useState } from 'react';
import { api } from '../services/api';
import Loading from '../components/Loading';
import { formatUSD } from '../utils/formatters';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
  if (error) return <div className="text-red-400 text-center py-12">{error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Total Intents', value: stats?.intents || 0 },
          { title: 'Approved', value: stats?.approved || 0 },
          { title: 'Denied', value: stats?.denied || 0 },
          { title: 'Total Volume', value: formatUSD(stats?.totalVolume || 0) },
        ].map((card, i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-2">{card.title}</h3>
            <p className="text-2xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </div>
      {stats?.agentList?.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Active Agents</h2>
          <div className="space-y-3">
            {stats.agentList.map((agent, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                <div>
                  <p className="text-white font-medium">{agent.name || agent.agentId}</p>
                  <p className="text-gray-400 text-sm">{agent.walletAddr}</p>
                </div>
                <span className={agent.active ? 'text-green-400' : 'text-gray-400'}>
                  {agent.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
