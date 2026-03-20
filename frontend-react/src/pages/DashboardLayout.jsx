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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0B0E14', color: '#fff', fontFamily: 'sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: '260px', background: 'rgba(21, 26, 35, 0.7)', borderRight: '1px solid rgba(255,255,255,0.08)', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 2.5rem 0', background: 'linear-gradient(to right, #FFF, #9D84FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Zion POS
        </h2>
        
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map(item => (
            <Link key={item.path} to={item.path} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1.25rem', borderRadius: '12px', color: '#8F9BB3', textDecoration: 'none', transition: 'all 0.2s', fontWeight: 500 }}>
              <item.icon size={20} />
              {item.name}
            </Link>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#8F9BB3', marginBottom: '1rem' }}>{currentUser?.email}</div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem 1rem', background: 'rgba(255, 61, 113, 0.1)', color: '#FF3D71', border: '1px solid transparent', borderRadius: '12px', cursor: 'pointer', fontWeight: 600 }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, height: '100vh', overflow: 'auto', padding: '2.5rem' }}>
        <Outlet />
      </main>
    </div>
  );
}
