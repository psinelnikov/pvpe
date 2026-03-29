import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWeb3 } from '../contexts/Web3Context';
import { 
  LayoutDashboard, 
  ArrowRight,
  Cpu,
  ArrowUpDown,
  LogOut,
  Key,
  Wallet2
} from 'lucide-react';

const Layout = ({ children }) => {
  const { isAuthenticated, logout } = useAuth();
  const { account, connectWallet, disconnectWallet, error } = useWeb3();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  const navItems = [
    { path: '/lending', label: 'Process', icon: ArrowRight },
    { path: '/bridge', label: 'Bridge', icon: ArrowUpDown },
    { path: '/tee-demo', label: 'TEE Demo', icon: Cpu },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <nav style={{background: '#1f2937', borderBottom: '0.5px solid #374151', padding: '0 1rem', height: '52px', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', boxSizing: 'border-box', overflowX: 'auto'}}>
        <Link to="/" style={{display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontWeight: '600', fontSize: '15px', textDecoration: 'none', flexShrink: 0, marginRight: '8px'}}>
          <Key style={{width: '18px', height: '18px', stroke: '#818cf8'}} />
          Rayls Vault
        </Link>

        <div style={{width: '1px', height: '20px', background: '#374151', flexShrink: 0}}></div>

        <Link to="/lending" style={{display: 'flex', alignItems: 'center', gap: '5px', color: '#d1d5db', fontSize: '13px', fontWeight: '500', textDecoration: 'none', padding: '5px 10px', borderRadius: '6px', flexShrink: 0, whiteSpace: 'nowrap'}}>
          <ArrowRight style={{width: '14px', height: '14px'}} />
          Process
        </Link>

        <Link to="/bridge" style={{display: 'flex', alignItems: 'center', gap: '5px', color: '#d1d5db', fontSize: '13px', fontWeight: '500', textDecoration: 'none', padding: '5px 10px', borderRadius: '6px', flexShrink: 0, whiteSpace: 'nowrap'}}>
          <ArrowUpDown style={{width: '14px', height: '14px'}} />
          Bridge
        </Link>

        <Link to="/tee-demo" style={{display: 'flex', alignItems: 'center', gap: '5px', color: 'white', fontSize: '13px', fontWeight: '500', textDecoration: 'none', padding: '5px 10px', borderRadius: '6px', background: '#4f46e5', flexShrink: 0, whiteSpace: 'nowrap'}}>
          <Cpu style={{width: '14px', height: '14px'}} />
          TEE Demo
        </Link>

        <button onClick={handleLogout} style={{display: 'flex', alignItems: 'center', gap: '5px', color: '#d1d5db', fontSize: '13px', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer', padding: '5px 10px', borderRadius: '6px', flexShrink: 0, whiteSpace: 'nowrap', marginLeft: 'auto'}}>
          <LogOut style={{width: '14px', height: '14px'}} />
          Logout
        </button>
      </nav>

      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
