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
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Agents</h1>
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-6">
          {agents.length > 0 ? (
            <div className="space-y-3">
              {agents.map((agent, i) => (
                <div key={i} className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-white font-medium">{agent.name || agent.agentId}</h3>
                    <span className={agent.active ? 'text-green-400' : 'text-gray-400'}>
                      {agent.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">Wallet: {agent.walletAddr}</p>
                  <p className="text-gray-400 text-sm">Policy: {agent.policyId}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No agents registered</p>
          )}
        </div>
      </div>
    </div>
  );
}
