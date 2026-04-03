import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  ChevronRight, 
  Lock, 
  Store,
  RefreshCw,
  Search,
  DollarSign,
  ArrowLeft,
  Calendar,
  Package,
  Activity,
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useTheme } from '../context/ThemeContext';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function AdminDashboard() {
  const { theme, toggleTheme } = useTheme();
  const [adminKey, setAdminKey] = useState(localStorage.getItem('nexus_admin_key') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [overview, setOverview] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

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

  const fetchBusinessDetail = async (id) => {
    try {
      setDetailLoading(true);
      const config = { headers: { 'x-admin-key': adminKey } };
      const res = await axios.get(`${API_BASE}/admin/businesses/${id}`, config);
      setSelectedBusiness(res.data.data);
      setShowDetail(true);
    } catch (err) {
      console.error("Failed to fetch business detail", err);
    } finally {
      setDetailLoading(false);
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
      <div className="login-page" style={{ 
        background: theme === 'dark' ? '#0B0F19' : '#F3F4F6',
        transition: 'background 0.3s ease'
      }}>
        <div className="login-card glass" style={{ maxWidth: '440px', textAlign: 'center', padding: '48px' }}>
          <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
             <button onClick={toggleTheme} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
               {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
             </button>
          </div>
          <div className="login-logo" style={{ 
            margin: '0 auto 24px', 
            background: 'var(--accent)', 
            width: '72px', height: '72px', 
            borderRadius: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)'
          }}>
            <Lock size={32} color="white" />
          </div>
          <h1 style={{ marginBottom: '12px', fontSize: '28px', fontStyle: 'normal' }}>Master Terminal</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '15px' }}>
              The Nexus POS Administrative console is restricted. 
              Please provide the Master Secret Key.
          </p>
          
          <form onSubmit={handleLogin}>
            <div className="input-group" style={{ textAlign: 'left', marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                X-ADMIN-KEY
              </label>
              <input 
                type="password" 
                value={adminKey} 
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="PRO-MASTER-••••••••"
                required
                autoFocus
                className="input-premium"
                style={{ fontSize: '16px', letterSpacing: '4px' }}
              />
            </div>
            
            {error && (
              <div className="error-alert" style={{ marginBottom: '24px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                {error}
              </div>
            )}
            
            <button type="submit" className="btn-primary" style={{ width: '100%', height: '52px' }} disabled={loading}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <RefreshCw size={18} className="animate-spin" /> Verifying...
                </div>
              ) : 'Authenticate Access'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-root" style={{ 
      background: 'var(--bg)', 
      color: 'var(--text)', 
      minHeight: '100vh', 
      display: 'block',
      transition: 'all 0.3s ease'
    }}>
      {/* Top Header */}
      <header style={{ 
        height: '72px', 
        borderBottom: '1px solid var(--border)', 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0 40px',
        justifyContent: 'space-between',
        background: 'var(--surface)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '12px', 
            background: 'linear-gradient(135deg, var(--accent) 0%, #3b82f6 100%)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <ShoppingBag size={22} color="white" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, lineHeight: 1 }}>Nexus Master</h2>
            <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>System Administrator</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button onClick={toggleTheme} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={() => fetchAdminData(adminKey)}
            style={{ background: 'transparent', color: 'var(--text-muted)' }}
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={handleLogout}
            style={{ 
              padding: '8px 16px', borderRadius: '8px', 
              background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', 
              fontWeight: 700, fontSize: '13px'
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main style={{ padding: '40px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', marginBottom: '40px' }}>
            <div>
               <h1 style={{ fontSize: '32px', marginBottom: '8px', fontWeight: 800 }}>System Analytics</h1>
               <p style={{ color: 'var(--text-muted)' }}>Real-time overview of the Nexus POS network and business health.</p>
            </div>
            <div style={{ 
              background: 'var(--surface)', 
              borderRadius: '16px', 
              padding: '12px 20px', 
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: '12px'
            }}>
              <Activity size={24} color="var(--accent)" />
              <div>
                 <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Network Status</div>
                 <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>System Operational</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px', marginBottom: '40px' }}>
             {/* Main Chart Card */}
             <div className="card-elevated" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                 <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Sales Growth (Last 7 Days)</h3>
                 <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Real-time Aggregation</div>
               </div>
               
               <div style={{ height: '300px', width: '100%' }}>
                  {overview?.salesTrend ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={overview.salesTrend}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis 
                          dataKey="day" 
                          stroke="var(--text-muted)" 
                          fontSize={12} 
                          tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { weekday: 'short' })}
                        />
                        <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(val) => `KSh ${val}`} />
                        <Tooltip 
                          contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                          itemStyle={{ color: 'var(--accent)', fontWeight: 700 }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="var(--accent)" 
                          fillOpacity={1} 
                          fill="url(#colorSales)" 
                          strokeWidth={3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      Insufficient data for chart
                    </div>
                  )}
               </div>
             </div>

             {/* Stats Grid 2x2 */}
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="stat-card glass" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
                   <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '10px', borderRadius: '12px' }}>
                      <Users size={20} />
                   </div>
                   <div>
                      <span className="stat-title">Active Tenants</span>
                      <span className="stat-value" style={{ fontSize: '24px' }}>{overview?.totalBusinesses}</span>
                   </div>
                </div>
                <div className="stat-card glass" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
                   <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '10px', borderRadius: '12px' }}>
                      <TrendingUp size={20} />
                   </div>
                   <div>
                      <span className="stat-title">System Sales</span>
                      <span className="stat-value" style={{ fontSize: '24px' }}>{overview?.totalSalesCount}</span>
                   </div>
                </div>
                <div className="stat-card glass" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
                   <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '10px', borderRadius: '12px' }}>
                      <DollarSign size={20} />
                   </div>
                   <div>
                      <span className="stat-title">Total Rev</span>
                      <span className="stat-value" style={{ fontSize: '24px' }}>{overview?.totalRevenue?.toLocaleString()}</span>
                   </div>
                </div>
                <div className="stat-card glass" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
                   <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '10px', borderRadius: '12px' }}>
                      <ShoppingBag size={20} />
                   </div>
                   <div>
                      <span className="stat-title">Items</span>
                      <span className="stat-value" style={{ fontSize: '24px' }}>{overview?.totalProducts}</span>
                   </div>
                </div>
             </div>
          </div>

          {/* Business Table */}
          <div className="dashboard-section glass" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                 <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Merchant Registry</h3>
                 <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Management and audit console for all sub-tenants.</p>
              </div>
              <div className="search-box" style={{ minWidth: '400px' }}>
                <Search size={18} color="var(--text-muted)" />
                <input 
                  placeholder="Filter by business name or contact email..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="pos-table">
                <thead>
                  <tr>
                    <th>Terminal Identity</th>
                    <th>Ownership</th>
                    <th>Joined</th>
                    <th>Metrics</th>
                    <th>Gross Volume</th>
                    <th>Account</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBusinesses.map(business => (
                    <tr key={business.id}>
                      <td className="product-name">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ 
                            width: '36px', height: '36px', borderRadius: '8px', 
                            background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                          }}>
                            <Store size={18} color="var(--text-muted)" />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                             {business.name}
                             <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>ID: {business.id.substring(0,8)}</span>
                          </div>
                        </div>
                      </td>
                      <td>{business.owner_email}</td>
                      <td>{new Date(business.created_at).toLocaleDateString()}</td>
                      <td>
                         <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ background: 'var(--border)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>{business.product_count}p</span>
                            <span style={{ background: 'var(--border)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>{business.sales_count}s</span>
                         </div>
                      </td>
                      <td style={{ fontWeight: 800, color: 'var(--accent)' }}>KSh {parseFloat(business.total_revenue || 0).toLocaleString()}</td>
                      <td>
                         <span style={{ 
                           padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, 
                           background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent)' 
                         }}>ACTIVE</span>
                      </td>
                      <td>
                        <button 
                          onClick={() => fetchBusinessDetail(business.id)}
                          disabled={detailLoading}
                          style={{ color: 'var(--text-muted)', background: 'transparent' }}
                        >
                          <ChevronRight size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Business Detail Panel - Backdrop */}
      {showDetail && (
        <div 
          className="modal-backdrop" 
          onClick={() => setShowDetail(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000
          }}
        />
      )}

      {/* Side Slide-over Panel */}
      <div style={{
        position: 'fixed', top: 0, right: showDetail ? 0 : '-600px',
        width: '560px', height: '100vh', background: 'var(--bg)',
        borderLeft: '1px solid var(--border)', zIndex: 1001,
        transition: 'right 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        padding: '32px', overflowY: 'auto'
      }}>
        {selectedBusiness && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
               <button onClick={() => setShowDetail(false)} style={{ background: 'transparent', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ArrowLeft size={18} /> Close Panel
               </button>
               <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)' }}>ANALYTICS LIVE</span>
            </div>

            <div style={{ marginBottom: '40px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                     <Store size={28} />
                  </div>
                  <div>
                     <h2 style={{ fontSize: '24px', fontWeight: 800 }}>{selectedBusiness.business.name}</h2>
                     <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{selectedBusiness.business.owner_email}</p>
                  </div>
               </div>
               
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                     <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Date Joined</div>
                     <div style={{ fontSize: '15px', fontWeight: 700 }}>{new Date(selectedBusiness.business.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                     <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Subscription</div>
                     <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent)' }}>Active (Lifetime)</div>
                  </div>
               </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
               <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} /> Top Selling Products
               </h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedBusiness.topProducts.map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--surface)', borderRadius: '8px' }}>
                       <span style={{ fontWeight: 600 }}>{p.product_name}</span>
                       <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>KSh {parseFloat(p.revenue).toLocaleString()}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.count} units sold</div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div>
               <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} /> Recent Transaction History
               </h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedBusiness.recentSales.map((s, i) => (
                    <div key={i} style={{ padding: '12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                       <div>
                          <div style={{ fontSize: '14px', fontWeight: 600 }}>{s.product_name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(s.created_at).toLocaleString()}</div>
                       </div>
                       <div style={{ fontWeight: 700 }}>KSh {parseFloat(s.total).toLocaleString()}</div>
                    </div>
                  ))}
               </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
