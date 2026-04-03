import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  ChevronRight, 
  Lock, 
  Store,
  RefreshCw,
  Search,
  ExternalLink,
  DollarSign
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function AdminDashboard() {
  const [adminKey, setAdminKey] = useState(localStorage.getItem('nexus_admin_key') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [overview, setOverview] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAdminData = async (key) => {
    try {
      setLoading(true);
      setError('');
      
      const config = {
        headers: { 'x-admin-key': key }
      };

      const [overviewRes, businessesRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/overview`, config),
        axios.get(`${API_BASE}/admin/businesses`, config)
      ]);

      setOverview(overviewRes.data.data);
      setBusinesses(businessesRes.data.data);
      setIsAuthenticated(true);
      localStorage.setItem('nexus_admin_key', key);
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Check your secret key.');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminKey) {
      fetchAdminData(adminKey);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    fetchAdminData(adminKey);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminKey('');
    localStorage.removeItem('nexus_admin_key');
  };

  const filteredBusinesses = businesses.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.owner_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="login-page" style={{ background: '#0B0F19' }}>
        <div className="login-card glass" style={{ maxWidth: '400px', textAlign: 'center' }}>
          <div className="login-logo" style={{ margin: '0 auto 20px', background: 'var(--accent)' }}>
            <Lock size={32} color="white" />
          </div>
          <h1 style={{ marginBottom: '8px' }}>Admin Access</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Enter the master secret key to proceed.</p>
          
          <form onSubmit={handleLogin}>
            <div className="input-group" style={{ textAlign: 'left', marginBottom: '20px' }}>
              <label>Secret Key</label>
              <input 
                type="password" 
                value={adminKey} 
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="••••••••••••••••"
                required
                autoFocus
              />
            </div>
            
            {error && (
              <div className="error-alert" style={{ marginBottom: '20px' }}>
                {error}
              </div>
            )}
            
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Unlock Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-root" style={{ background: '#0B0F19', minHeight: '100vh', display: 'block' }}>
      {/* Top Header */}
      <header style={{ 
        height: '70px', 
        borderBottom: '1px solid var(--border)', 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0 40px',
        justifyContent: 'space-between',
        background: 'rgba(11, 15, 25, 0.8)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '36px', height: '36px', borderRadius: '8px', 
            background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <ShoppingBag size={20} color="white" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Nexus Master</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => fetchAdminData(adminKey)}
            style={{ background: 'transparent', color: 'var(--text-muted)' }}
            className="hover-btn"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={handleLogout}
            style={{ 
              padding: '8px 16px', borderRadius: '8px', 
              background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: 600 
            }}
          >
            Exit Terminal
          </button>
        </div>
      </header>

      <main style={{ padding: '40px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>System Overview</h1>
            <p style={{ color: 'var(--text-muted)' }}>Monitoring {overview?.totalBusinesses} regional micro-businesses.</p>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid" style={{ marginBottom: '40px' }}>
            <div className="stat-card glass">
              <div>
                <span className="stat-title">Total Tenants</span>
                <span className="stat-value">{overview?.totalBusinesses}</span>
              </div>
              <div className="stat-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                <Users size={24} />
              </div>
            </div>

            <div className="stat-card glass">
              <div>
                <span className="stat-title">System Sales</span>
                <span className="stat-value">{overview?.totalSalesCount}</span>
              </div>
              <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <TrendingUp size={24} />
              </div>
            </div>

            <div className="stat-card glass">
              <div>
                <span className="stat-title">Total Revenue</span>
                <span className="stat-value">KSh {overview?.totalRevenue?.toLocaleString()}</span>
              </div>
              <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <DollarSign size={24} />
              </div>
            </div>

            <div className="stat-card glass">
              <div>
                <span className="stat-title">Catalog Size</span>
                <span className="stat-value">{overview?.totalProducts}</span>
              </div>
              <div className="stat-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                <ShoppingBag size={24} />
              </div>
            </div>
          </div>

          {/* Business Table */}
          <div className="dashboard-section glass" style={{ padding: '0' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Business Directory</h3>
              <div className="search-box" style={{ minWidth: '400px' }}>
                <Search size={18} color="var(--text-muted)" />
                <input 
                  placeholder="Search by name or email..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="table-card" style={{ overflowX: 'auto' }}>
              <table className="pos-table">
                <thead>
                  <tr>
                    <th>Business Name</th>
                    <th>Owner</th>
                    <th>Registered</th>
                    <th>Stock</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBusinesses.map(business => (
                    <tr key={business.id}>
                      <td className="product-name">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ 
                            width: '32px', height: '32px', borderRadius: '6px', 
                            background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                          }}>
                            <Store size={16} color="var(--text-muted)" />
                          </div>
                          {business.name}
                        </div>
                      </td>
                      <td>{business.owner_email}</td>
                      <td>{new Date(business.created_at).toLocaleDateString()}</td>
                      <td>{business.product_count} items</td>
                      <td>{business.sales_count}</td>
                      <td className="price">KSh {parseFloat(business.total_revenue || 0).toLocaleString()}</td>
                      <td>
                        <button style={{ color: 'var(--accent)', background: 'transparent' }}>
                          <ChevronRight size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredBusinesses.length === 0 && (
                    <tr>
                      <td colSpan="7" className="empty-row">No businesses found matching your criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
