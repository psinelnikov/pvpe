import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [apiKey, setApiKey] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedKey = localStorage.getItem('api_key');
    if (storedKey) {
      setApiKey(storedKey);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = async (key) => {
    try {
      localStorage.setItem('api_key', key);
      setApiKey(key);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('api_key');
    setApiKey(null);
    setIsAuthenticated(false);
  };

  const bootstrap = async (orgId, name) => {
    try {
      const response = await api.bootstrapApiKey({ orgId, name });
      const newKey = response.key;
      await login(newKey);
      return { success: true, key: newKey, ...response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ apiKey, isAuthenticated, isLoading, login, logout, bootstrap }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
