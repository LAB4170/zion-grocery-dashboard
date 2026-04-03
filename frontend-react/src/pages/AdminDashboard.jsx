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
  Activity,
  Sun,
  Moon,
  PieChart as PieChartIcon,
  Globe,
  Clock,
  ArrowUpRight,
  LayoutDashboard,
  Zap,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useTheme } from '../context/ThemeContext';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboard() {
  const { theme, toggleTheme } = useTheme();
  const [adminKey, setAdminKey] = useState(localStorage.getItem('nexus_admin_key') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, businesses, activities
  const [overview, setOverview] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [activities, setActivities] = useState([]);
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
      
      const config = { headers: { 'x-admin-key': key } };

      const [overviewRes, businessesRes, activitiesRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/overview`, config),
        axios.get(`${API_BASE}/admin/businesses`, config),
        axios.get(`${API_BASE}/admin/activities`, config)
      ]);

      setOverview(overviewRes.data.data);
      setBusinesses(businessesRes.data.data);
      setActivities(activitiesRes.data.data);
      setIsAuthenticated(true);
      localStorage.setItem('nexus_admin_key', key);
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed.');
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
      console.error("Detail fetch failed", err);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (adminKey) fetchAdminData(adminKey);
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
        transition: 'background 0.3s ease',
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px'
      }}>
        <div className="login-card glass" style={{ maxWidth: '440px', width: '100%', textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
             <button onClick={toggleTheme} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
               {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
             </button>
          </div>
          <div className="login-logo" style={{ 
            margin: '0 auto 24px', background: 'var(--accent)', 
            width: '64px', height: '64px', borderRadius: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)'
          }}>
            <Lock size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Master Terminal</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '14px' }}>System oversight access restricted.</p>
          <form onSubmit={handleLogin}>
            <div className="input-group" style={{ textAlign: 'left', marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>X-ADMIN-KEY</label>
              <input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} required autoFocus className="input-premium" />
            </div>
            {error && <div className="error-alert" style={{ marginBottom: '24px', fontSize: '13px' }}>{error}</div>}
            <button type="submit" className="btn-primary" style={{ width: '100%', height: '52px' }} disabled={loading}>
              {loading ? <RefreshCw size={18} className="animate-spin" /> : 'Authenticate Access'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-root" style={{ 
      background: 'var(--bg)', color: 'var(--text)', 
      minHeight: '100vh', display: 'flex', flexDirection: 'column'
    }}>
      {/* Responsive Header */}
      <header className="glass" style={{
        padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)', sticky: 'top', zIndex: 100, background: 'var(--surface)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Globe size={18} color="white" />
          </div>
          <div className="hide-mobile">
            <h2 style={{ fontSize: '14px', fontWeight: 800, margin: 0 }}>Command Center</h2>
            <span style={{ fontSize: '9px', color: 'var(--accent)', fontWeight: 800 }}>MONITOR</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={toggleTheme} className="btn-icon-mobile">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
          <button onClick={() => fetchAdminData(adminKey)} className="btn-icon-mobile"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button>
          <button onClick={handleLogout} style={{ 
            fontSize: '11px', fontWeight: 800, padding: '8px 12px', borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444'
          }}>LOGOUT</button>
        </div>
      </header>

      {/* Tab Navigation Menu */}
      <nav style={{ 
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        display: 'flex', padding: '0 24px', position: 'sticky', top: '56px', zIndex: 99
      }}>
        {[
          { id: 'overview', icon: <LayoutDashboard size={18} />, label: 'OVERVIEW' },
          { id: 'businesses', icon: <Store size={18} />, label: 'MERCHANTS' },
          { id: 'activities', icon: <Activity size={18} />, label: 'LIVE FEED' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '11px', fontWeight: 800, background: 'transparent',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
              borderRadius: 0, transition: 'all 0.2s ease'
            }}
          >
            {tab.icon}
            <span className="hide-mobile">{tab.label}</span>
          </button>
        ))}
      </nav>

      <main style={{ padding: '24px', flex: 1, maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        
        {/* Tab 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="fade-in">
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                {['TENANTS', 'TOTAL SALES', 'REVENUE', 'INVENTORY'].map((label, idx) => (
                  <div key={idx} className="card-elevated" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                       <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)' }}>{label}</span>
                       <Zap size={14} color="var(--accent)" />
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 800 }}>
                      {idx === 0 && overview?.totalBusinesses}
                      {idx === 1 && overview?.totalSalesCount}
                      {idx === 2 && `KSh ${overview?.totalRevenue?.toLocaleString()}`}
                      {idx === 3 && overview?.totalProducts}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 800, marginTop: '8px' }}>SYSTEM-WIDE SCAN</div>
                  </div>
                ))}
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                <div className="card-elevated" style={{ padding: '24px' }}>
                   <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '24px' }}>System Growth (7 Days)</h3>
                   <div style={{ height: '300px' }}>
                      {overview?.salesTrend?.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={overview?.salesTrend}>
                            <defs><linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2}/><stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis dataKey="day" tick={{fontSize: 10}} tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { weekday: 'short' })} />
                            <YAxis tick={{fontSize: 10}} tickFormatter={(val) => `${val/1000}k`} />
                            <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }} />
                            <Area type="monotone" dataKey="amount" stroke="var(--accent)" fill="url(#areaColor)" strokeWidth={3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '12px' }}>
                          No sales data available for this period.
                        </div>
                      )}
                   </div>
                </div>

                <div className="card-elevated" style={{ padding: '24px' }}>
                   <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '24px' }}>Market Breakdown</h3>
                   <div style={{ height: '240px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={overview?.paymentBreakdown || []} 
                            innerRadius={60} 
                            outerRadius={80} 
                            paddingAngle={5} 
                            dataKey="value" 
                            nameKey="name"
                          >
                            {(overview?.paymentBreakdown || []).map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                          <Legend iconType="circle" wrapperStyle={{fontSize: '11px'}} />
                        </PieChart>
                      </ResponsiveContainer>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Tab 2: MERCHANTS */}
        {activeTab === 'businesses' && (
          <div className="fade-in">
             <div className="card-elevated" style={{ padding: '0', overflow: 'hidden' }}>
               <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                  <div className="search-box">
                    <Search size={16} />
                    <input placeholder="Search businesses/emails..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{fontSize: '14px'}} />
                  </div>
               </div>
               
               {/* Mobile List View / Desktop Table View */}
               <div className="merchant-list">
                  {(filteredBusinesses || []).map(b => {
                    const isOnline = b.last_activity_at && (new Date() - new Date(b.last_activity_at)) < (1000 * 60 * 60 * 24);
                    const isRecent = b.last_activity_at && (new Date() - new Date(b.last_activity_at)) < (1000 * 60 * 60 * 24 * 30);
                    
                    return (
                      <div key={b.id} className="merchant-row" onClick={() => fetchBusinessDetail(b.id)}>
                         <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: '15px' }}>{b.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.owner_email}</div>
                         </div>
                         <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '14px' }}>KSh {parseFloat(b.total_revenue || 0).toLocaleString()}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '4px' }}>
                               {isOnline ? <ShieldCheck size={12} color="#10b981" /> : <AlertCircle size={12} color={isRecent ? '#f59e0b' : '#ef4444'} />}
                               <span style={{ fontSize: '10px', fontWeight: 800, color: isOnline ? '#10b981' : (isRecent ? '#f59e0b' : '#ef4444') }}>
                                 {isOnline ? 'HEALTHY' : (isRecent ? 'INACTIVE' : 'DORMANT')}
                               </span>
                            </div>
                         </div>
                         <div style={{ paddingLeft: '12px' }}>
                            <ChevronRight size={18} color="var(--text-muted)" />
                         </div>
                      </div>
                    );
                  })}
               </div>
             </div>
          </div>
        )}

        {/* Tab 3: LIVE FEED */}
        {activeTab === 'activities' && (
          <div className="fade-in">
             <div className="card-elevated" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <Clock size={20} color="var(--accent)" /> Global Transaction Log
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   {activities.length > 0 ? activities.map(act => (
                     <div key={act.id} style={{ 
                       padding: '16px', background: 'var(--surface)', borderRadius: '12px', 
                       border: '1px solid var(--border)', display: 'flex', gap: '12px'
                     }}>
                        <div style={{ width: '4px', background: 'var(--accent)', borderRadius: '2px' }}></div>
                        <div style={{ flex: 1 }}>
                           <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent)', marginBottom: '4px' }}>{act.business_name?.toUpperCase()}</div>
                           <div style={{ fontWeight: 700, fontSize: '14px' }}>{act.product_name} x {act.quantity}</div>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 800 }}>KSh {parseFloat(act.total).toLocaleString()}</span>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           </div>
                        </div>
                     </div>
                   )) : (
                     <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No global activities detected in the last cycle.
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}

      </main>

      {/* Slide-over Detail Panel (Responsive) */}
      {showDetail && selectedBusiness && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
           <div className="modal-content glass side-panel" onClick={e => e.stopPropagation()}>
              <button className="panel-close" onClick={() => setShowDetail(false)}>
                 <ArrowLeft size={18} /> BACK
              </button>
              
              <div style={{ padding: '24px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                       <Store size={28} />
                    </div>
                    <div>
                       <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{selectedBusiness.business.name}</h2>
                       <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedBusiness.business.owner_email}</p>
                    </div>
                 </div>

                 <div style={{ marginBottom: '32px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-muted)' }}>TOP PRODUCTS</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                       {selectedBusiness.topProducts.map((p, i) => (
                         <div key={i} className="card-elevated" style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ fontWeight: 800 }}>{p.product_name}</span>
                            <span style={{ color: 'var(--accent)', fontWeight: 800 }}>KSh {parseFloat(p.revenue).toLocaleString()}</span>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div>
                    <h4 style={{ fontSize: '12px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-muted)' }}>RECENT SALES</h4>
                    <div style={{ borderTop: '1px solid var(--border)' }}>
                       {selectedBusiness.recentSales.map((s, i) => (
                         <div key={i} style={{ padding: '12px 0', borderBottom: '1px dashed var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <div>
                               <div style={{ fontWeight: 700 }}>{s.product_name}</div>
                               <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(s.created_at).toLocaleTimeString()}</div>
                            </div>
                            <div style={{ fontWeight: 800 }}>KSh {parseFloat(s.total).toLocaleString()}</div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Embedded Mobile CSS */}
      <style>{`
        .hide-mobile { display: block; }
        .merchant-row { 
          padding: 16px 24px; display: flex; align-items: center; border-bottom: 1px solid var(--border); 
          cursor: pointer; transition: background 0.2s;
        }
        .merchant-row:hover { background: var(--surface); }
        .merchant-row:last-child { border-bottom: none; }
        
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000;
          display: flex; justify-content: flex-end;
        }
        .side-panel {
          width: 480px; height: 100%; overflow-y: auto; background: var(--bg);
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .panel-close {
          background: transparent; padding: 16px 24px; color: var(--text-muted);
          display: flex; alignItems: center; gap: 8px; font-weight: 800; font-size: 11px;
        }

        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeIn 0.3s ease-out; }

        @media (max-width: 768px) {
          .hide-mobile { display: none; }
          .side-panel { width: 100%; }
          .btn-icon-mobile { padding: 8px; }
        }
      `}</style>
    </div>
  );
}
