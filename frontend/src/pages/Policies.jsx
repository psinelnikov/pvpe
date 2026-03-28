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
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Policies</h1>
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-6">
          {policies.length > 0 ? (
            <div className="space-y-3">
              {policies.map((policy, i) => (
                <div key={i} className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-white font-medium">{policy.name}</h3>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">{policy.policyId}</p>
                  <div className="flex gap-4 text-sm text-gray-300">
                    <span>Per-Tx: {formatUSD(policy.perTxLimit)}</span>
                    <span>Daily: {formatUSD(policy.dailyLimit)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No policies configured</p>
          )}
        </div>
      </div>
    </div>
  );
}
