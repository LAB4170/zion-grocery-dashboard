import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  Menu, X, LayoutDashboard, Package, ShoppingCart, 
  ArrowRightLeft, Users, Sun, Moon, LogOut, ChevronRight,
  BarChart3, History, Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useBusiness } from '../context/BusinessContext';

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { business } = useBusiness();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Overview', path: '/app/dashboard', icon: LayoutDashboard, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' },
    { name: 'Reports', path: '/app/reports', icon: BarChart3, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
    { name: 'Inventory', path: '/app/products', icon: Package, color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
    { name: 'Sales POS', path: '/app/sales', icon: ShoppingCart, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)' },
    { name: 'Sales History', path: '/app/sales/history', icon: History, color: '#EC4899', bg: 'rgba(236, 72, 153, 0.15)' },
    { name: 'Expenses', path: '/app/expenses', icon: ArrowRightLeft, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' },
    { name: 'Debts', path: '/app/debts', icon: Users, color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.15)' },
    { name: 'Settings', path: '/app/settings', icon: Settings, color: '#64748B', bg: 'rgba(100, 116, 139, 0.15)' },
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
        <div className="brand">{business?.name || 'NEXUS'}</div>
        <button className="menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      <aside className={`sidebar glass ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Z</div>
            {business?.name || 'NEXUS'}
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
                <div className="icon-tile" style={{ color: item.color, backgroundColor: isActive ? item.color : item.bg, color: isActive ? '#fff' : item.color }}>
                  <Icon size={18} strokeWidth={isActive ? 3 : 2.5} />
                </div>
                <span style={{ flex: 1, fontWeight: isActive ? 700 : 600 }}>{item.name}</span>
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
        <GlobalBillingBanner business={business} navigate={navigate} />
        
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
            onClick={() => navigate('/app/products')}
          >
            <Package size={16} /> + Product
          </button>
          <button 
            className="btn-primary" 
            style={{ padding: '8px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700 }}
            onClick={() => navigate('/app/sales')}
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

// Sub-component for globally enforcing visibility of the subscription status
function GlobalBillingBanner({ business, navigate }) {
  if (!business) return null;

  const status = business.subscription_status;
  
  if (status === 'active') return null;

  if (status === 'past_due') {
    return (
      <div className="global-billing-banner error">
        <div className="banner-content">
          <ArrowRightLeft size={18} />
          <span><strong>Subscription Expired:</strong> Your workspace is locked in Read-Only mode. Processing new sales is disabled.</span>
        </div>
        <button className="btn-renew" onClick={() => navigate('/app/settings')}>Renew MPesa</button>
      </div>
    );
  }

  if (status === 'trial') {
    const end = new Date(business.trial_ends_at);
    const now = new Date();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    
    if (diff <= 3) {
      return (
        <div className="global-billing-banner warning">
          <div className="banner-content">
            <Settings size={18} />
            <span><strong>Trial Ending Soon:</strong> You have {diff} day{diff === 1 ? '' : 's'} left of your free trial.</span>
          </div>
          <button className="btn-renew" onClick={() => navigate('/app/settings')}>Upgrade Plan</button>
        </div>
      );
    }
  }

  return null;
}
