import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Key } from 'lucide-react';
import Alert from '../components/Alert';

export default function Login() {
  const [mode, setMode] = useState('existing');
  const [apiKey, setApiKey] = useState('');
  const [orgId, setOrgId] = useState('');
  const [keyName, setKeyName] = useState('Admin Key');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login, bootstrap } = useAuth();
  const navigate = useNavigate();

  const handleExistingKey = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const result = await login(apiKey);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  const handleBootstrap = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const result = await bootstrap(orgId, keyName);
    setLoading(false);

    if (result.success) {
      setSuccess(`API Key created: ${result.key}. Save it safely! Redirecting...`);
      setTimeout(() => navigate('/'), 2000);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
          <div className="flex items-center justify-center mb-8">
            <Key className="w-12 h-12 text-indigo-400" />
          </div>

          <div className="flex mb-6 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => { setMode('existing'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'existing' ? 'bg-indigo-600 text-white' : 'text-gray-300'
              }`}
            >
              Existing API Key
            </button>
            <button
              onClick={() => { setMode('bootstrap'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'bootstrap' ? 'bg-indigo-600 text-white' : 'text-gray-300'
              }`}
            >
              Bootstrap New Key
            </button>
          </div>

          <h2 className="text-2xl font-bold text-white mb-6 text-left">
            {mode === 'existing' ? 'Login with API Key' : 'Create New API Key'}
          </h2>

          <Alert type="error" message={error} />
          <Alert type="success" message={success} />

          {mode === 'existing' ? (
            <form onSubmit={handleExistingKey} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="ap_xxxxxxxx"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Verifying...' : 'Login'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleBootstrap} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Organization ID
                </label>
                <input
                  type="text"
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="swiss_consortium"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Admin Key"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Bootstrap API Key'}
              </button>
            </form>
          )}

          <p className="mt-6 text-sm text-gray-400 text-left">
            Rayls Private Vault Policy Engine
          </p>
        </div>
      </div>
    </div>
  );
}
