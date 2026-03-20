import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Package, DollarSign, ArrowRightLeft, Calendar } from 'lucide-react';

export default function DashboardLayout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Sales', path: '/sales', icon: DollarSign },
    { name: 'Expenses', path: '/expenses', icon: ArrowRightLeft },
    { name: 'Debts', path: '/debts', icon: Calendar },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0B0E14', color: '#fff' }}>
      {/* Sidebar */}
      <aside style={{ 
        width: '260px', 
        background: 'rgba(21, 26, 35, 0.4)', 
        borderRight: '1px solid rgba(255,255,255,0.06)', 
        padding: '24px', 
        display: 'flex', 
        flexDirection: 'column',
        backdropFilter: 'blur(10px)'
      }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 800, 
          margin: '0 0 40px 0', 
          background: 'linear-gradient(135deg, #FFFFFF 0%, #6B48FF 100%)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-1px'
        }}>
          ZION POS
        </h2>
        
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map(item => (
            <Link 
              key={item.path} 
              to={item.path} 
              className="nav-link"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '12px 16px', 
                borderRadius: '12px', 
                color: '#8F9BB3', 
                textDecoration: 'none', 
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', 
                fontWeight: 600,
                fontSize: '15px'
              }}
            >
              <item.icon size={20} />
              {item.name}
            </Link>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px' }}>
          <div style={{ fontSize: '14px', color: '#6B48FF', marginBottom: '16px', fontWeight: 600 }}>
            {currentUser?.email?.split('@')[0]}
          </div>
          <button 
            onClick={handleLogout} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '8px', 
              width: '100%', 
              padding: '12px', 
              background: 'rgba(255, 61, 113, 0.1)', 
              color: '#FF3D71', 
              border: '1px solid rgba(255, 61, 113, 0.2)', 
              borderRadius: '12px', 
              cursor: 'pointer', 
              fontWeight: 700,
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            <LogOut size={18} /> Logout
          </button>
        </div>

        <style>{`
          .nav-link:hover {
            background: rgba(255, 255, 255, 0.05);
            color: #FFFFFF !important;
            transform: translateX(4px);
          }
        `}</style>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, height: '100vh', overflow: 'auto', padding: '2.5rem' }}>
        <Outlet />
      </main>
    </div>
  );
}
