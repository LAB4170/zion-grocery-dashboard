import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  Menu, X, LayoutDashboard, Package, ShoppingCart, 
  ArrowRightLeft, Users, Sun, Moon, LogOut, ChevronRight,
  BarChart3, History
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Inventory', path: '/products', icon: Package },
    { name: 'Sales POS', path: '/sales', icon: ShoppingCart },
    { name: 'Sales History', path: '/sales/history', icon: History },
    { name: 'Expenses', path: '/expenses', icon: ArrowRightLeft },
    { name: 'Debts', path: '/debts', icon: Users },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <div className="layout-root">
      <header className="mobile-header glass">
        <div className="brand">ZION</div>
        <button className="menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      <aside className={`sidebar glass ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Z</div>
            ZION
          </div>
          <p className="sub-brand">Grocery POS v2</p>
        </div>

        <nav className="nav-menu">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button 
                key={item.name}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  navigate(item.path);
                  setIsSidebarOpen(false);
                }}
              >
                <Icon size={20} />
                <span style={{ flex: 1 }}>{item.name}</span>
                {isActive && <ChevronRight size={14} opacity={0.6} />}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={toggleTheme}>
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <div className="user-info">
            <div className="user-avatar">
              {currentUser?.email ? currentUser.email[0].toUpperCase() : 'U'}
            </div>
            <div className="user-details">
              <span className="user-email">{currentUser?.email?.split('@')[0] || 'User'}</span>
              <span className="user-role">Administrator</span>
            </div>
          </div>

          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="content-top-bar glass" style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '16px',
          padding: '12px 24px',
          borderBottom: '1px solid var(--border)',
          marginBottom: '24px'
        }}>
          <button 
            className="glass" 
            style={{ padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}
            onClick={() => navigate('/products')}
          >
            <Package size={16} /> + Product
          </button>
          <button 
            className="btn-primary" 
            style={{ padding: '8px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700 }}
            onClick={() => navigate('/sales')}
          >
            <ShoppingCart size={16} /> New Sale
          </button>
        </header>
        <div className="content-inner">
          <Outlet />
        </div>
      </main>

      {isSidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 850
          }}
        />
      )}
    </div>
  );
}
