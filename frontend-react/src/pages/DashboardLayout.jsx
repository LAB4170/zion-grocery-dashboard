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

    </div>
  );
}
