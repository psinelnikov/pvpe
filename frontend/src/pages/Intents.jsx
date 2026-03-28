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
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Intents</h1>
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Agent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Purpose</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {intents.length > 0 ? (
                intents.map((intent, i) => (
                  <tr key={i} className="bg-gray-800">
                    <td className="px-6 py-4 text-sm text-white">{intent.intentId?.slice(0, 8)}...</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{intent.agentId}</td>
                    <td className="px-6 py-4 text-sm text-white">{formatUSD(intent.amount)}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{intent.purposeCode}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={getStatusColor(intent.decisionStatus)}>
                        {getStatusLabel(intent.decisionStatus)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-400">No intents found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
