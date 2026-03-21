import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LogOut, 
  LayoutDashboard, 
  Package, 
  DollarSign, 
  ArrowRightLeft, 
  Calendar,
  Menu,
  X,
  Sun,
  Moon
} from 'lucide-react';

export default function DashboardLayout() {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Inventory', path: '/products', icon: Package },
    { name: 'Sales', path: '/sales', icon: DollarSign },
    { name: 'Expenses', path: '/expenses', icon: ArrowRightLeft },
    { name: 'Debts', path: '/debts', icon: Calendar },
  ];

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className="layout-root">
      {/* Mobile Top Bar */}
      <div className="mobile-header glass">
        <div className="brand">ZION</div>
        <button onClick={toggleMobileMenu} className="menu-toggle">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`sidebar glass ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">ZION</div>
          <p className="sub-brand">Grocery POS</p>
        </div>
        
        <nav className="nav-menu">
          {navItems.map(item => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={toggleTheme} className="theme-toggle">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          
          <div className="user-info">
            <div className="user-avatar">{currentUser?.email?.charAt(0).toUpperCase()}</div>
            <div className="user-details">
              <span className="user-email">{currentUser?.email?.split('@')[0]}</span>
              <span className="user-role">Administrator</span>
            </div>
          </div>

          <button onClick={handleLogout} className="btn-logout">
            <LogOut size={18} /> <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="content-header">
           {/* Add context-specific header info here if needed */}
        </header>
        <div className="content-inner">
          <Outlet />
        </div>
      </main>

      <style jsx>{`
        .layout-root {
          display: flex;
          min-height: 100vh;
          background-color: var(--bg);
        }

        .mobile-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 64px;
          padding: 0 20px;
          align-items: center;
          justify-content: space-between;
          z-index: 1000;
        }

        .brand {
          font-family: var(--font-heading);
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -1px;
          color: var(--text);
        }

        .menu-toggle {
          background: transparent;
          color: var(--text);
        }

        .sidebar {
          width: var(--sidebar-width);
          height: 100vh;
          position: sticky;
          top: 0;
          display: flex;
          flex-direction: column;
          padding: 32px 24px;
          z-index: 900;
          transition: var(--transition);
        }

        .sidebar-header {
          margin-bottom: 48px;
        }

        .sub-brand {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .nav-menu {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: var(--radius-md);
          color: var(--text-muted);
          font-weight: 600;
          font-size: 15px;
        }

        .nav-item:hover {
          background-color: var(--surface-hover);
          color: var(--text);
          transform: translateX(4px);
        }

        .nav-item.active {
          background-color: var(--accent);
          color: white;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }

        .sidebar-footer {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding-top: 24px;
          border-top: 1px solid var(--border);
        }

        .theme-toggle {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: var(--surface-hover);
          color: var(--text);
          border-radius: var(--radius-sm);
          font-size: 14px;
          font-weight: 600;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          background-color: var(--border);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: var(--accent);
        }

        .user-details {
          display: flex;
          flex-direction: column;
        }

        .user-email {
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
        }

        .user-role {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 600;
        }

        .btn-logout {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px;
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger);
          border-radius: var(--radius-md);
          font-weight: 700;
          font-size: 14px;
        }

        .btn-logout:hover {
          background: var(--danger);
          color: white;
        }

        .main-content {
          flex: 1;
          padding: 40px;
          overflow-x: hidden;
        }

        .content-inner {
          max-width: 1200px;
          margin: 0 auto;
        }

        @media (max-width: 1024px) {
          .mobile-header {
            display: flex;
          }

          .sidebar {
            position: fixed;
            left: -100%;
            height: 100vh;
            background-color: var(--bg);
          }

          .sidebar.open {
            left: 0;
            width: 100%;
          }

          .main-content {
            padding: 100px 20px 40px;
          }
        }
      `}</style>
    </div>
  );
}
