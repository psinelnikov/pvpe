import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Web3Provider } from './contexts/Web3Context';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Lending from './pages/Lending';
import TEEDemo from './pages/TEEDemo';
import Bridge from './pages/Bridge';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
    </div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Web3Provider>
      <AuthProvider>
        <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/lending"
            element={
              <ProtectedRoute>
                <Layout>
                  <Lending />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tee-demo"
            element={
              <ProtectedRoute>
                <Layout>
                  <TEEDemo />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bridge"
            element={
              <ProtectedRoute>
                <Layout>
                  <Bridge />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
    </Web3Provider>
  );
}

export default App;
