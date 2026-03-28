import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Agents from './pages/Agents';
import Intents from './pages/Intents';
import Policies from './pages/Policies';
import Admin from './pages/Admin';
import Lending from './pages/Lending';
import TEEDemo from './pages/TEEDemo';

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
            path="/agents"
            element={
              <ProtectedRoute>
                <Layout>
                  <Agents />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/intents"
            element={
              <ProtectedRoute>
                <Layout>
                  <Intents />
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
            path="/policies"
            element={
              <ProtectedRoute>
                <Layout>
                  <Policies />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Layout>
                  <Admin />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
