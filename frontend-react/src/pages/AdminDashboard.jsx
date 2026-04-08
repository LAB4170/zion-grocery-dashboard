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
  const [adminNotes, setAdminNotes] = useState('');

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
      setAdminNotes(res.data.data.business.admin_notes || '');
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

  const handleSuspendToggle = async (bId, currentStatus) => {
    try {
      const config = { headers: { 'x-admin-key': adminKey } };
      await axios.post(`${API_BASE}/admin/businesses/${bId}/status`, {
        is_suspended: !currentStatus,
        admin_notes: adminNotes
      }, config);
      alert(`Business ${!currentStatus ? 'suspended' : 'activated'} successfully.`);
      fetchAdminData(adminKey);
      fetchBusinessDetail(bId);
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleExtendTrial = async (bId) => {
    try {
      const config = { headers: { 'x-admin-key': adminKey } };
      await axios.post(`${API_BASE}/admin/businesses/${bId}/extend-trial`, { days: 7 }, config);
      alert('Trial extended by 7 days.');
      fetchAdminData(adminKey);
      fetchBusinessDetail(bId);
    } catch (err) {
      alert('Failed to extend trial.');
    }
  };

  const handleImpersonate = async (bId) => {
    try {
      const config = { headers: { 'x-admin-key': adminKey } };
      const res = await axios.post(`${API_BASE}/admin/businesses/${bId}/impersonate`, {}, config);
      
      // Navigate to the consumer frontend with the token
      const impersonationToken = res.data.customToken;
      localStorage.setItem('nexus_auth_token', impersonationToken);
      window.open('/app', '_blank'); // Open dashboard in new tab
    } catch (err) {
      alert('Impersonation failed: ' + (err.response?.data?.message || err.message));
    }
  };

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
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Responsive Header */}
      <header className="glass" style={{
        padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100, background: 'var(--surface)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '36px', height: '36px', borderRadius: '10px', 
            background: 'linear-gradient(135deg, var(--accent) 0%, #059669 100%)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
          }}>
            <Globe size={20} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Command Center</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="dot-pulse"></span>
              <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 800 }}>LIVE SYSTEM MONITOR</span>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="hide-mobile" style={{ textAlign: 'right', marginRight: '12px' }}>
             <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)' }}>RETENTION</div>
             <div style={{ fontSize: '14px', fontWeight: 800 }}>{overview?.retentionRate}%</div>
          </div>
          <button onClick={toggleTheme} className="btn-icon-premium">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
          <button onClick={() => fetchAdminData(adminKey)} className="btn-icon-premium"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button>
          <button onClick={handleLogout} style={{ 
            fontSize: '11px', fontWeight: 800, padding: '8px 16px', borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>LOGOUT</button>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{ 
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        display: 'flex', padding: '0 24px', position: 'sticky', top: '61px', zIndex: 99
      }}>
        {[
          { id: 'overview', icon: <LayoutDashboard size={18} />, label: 'SYSTEM OVERVIEW' },
          { id: 'businesses', icon: <Store size={18} />, label: 'MERCHANT FLEET' },
          { id: 'activities', icon: <Activity size={18} />, label: 'GLOBAL TELEMETRY' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '18px 24px', display: 'flex', alignItems: 'center', gap: '10px',
              fontSize: '12px', fontWeight: 700, background: 'transparent',
              borderBottom: activeTab === tab.id ? '3px solid var(--accent)' : '3px solid transparent',
              color: activeTab === tab.id ? 'var(--text)' : 'var(--text-muted)',
              borderRadius: 0, transition: 'all 0.3s ease'
            }}
          >
            {tab.icon}
            <span className="hide-mobile">{tab.label}</span>
          </button>
        ))}
      </nav>

      <main style={{ padding: '32px 24px', flex: 1, maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        
        {activeTab === 'overview' && (
          <div className="fade-in">
             {/* Stats Grid */}
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                {[
                  { label: 'TOTAL TENANTS', val: overview?.totalBusinesses, sub: `${overview?.growth?.activeTenants} Active`, icon: <Users /> },
                  { label: 'GROSS VOLUME', val: `KSh ${overview?.totalRevenue?.toLocaleString()}`, sub: `${overview?.growth?.revenue}% MoM`, icon: <TrendingUp />, pos: overview?.growth?.revenue >= 0 },
                  { label: 'TRANSAC. COUNT', val: overview?.totalSalesCount?.toLocaleString(), sub: 'Lifetime Volume', icon: <Zap /> },
                  { label: 'RETENTION', val: `${overview?.retentionRate}%`, sub: '30-Day Active', icon: <ShieldCheck /> }
                ].map((stat, idx) => (
                  <div key={idx} className="card-premium" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                       <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{stat.label}</span>
                       <div style={{ color: 'var(--accent)' }}>{stat.icon}</div>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>{stat.val}</div>
                    <div style={{ 
                      fontSize: '11px', fontWeight: 700, 
                      color: stat.pos === undefined ? 'var(--text-muted)' : (stat.pos ? '#10b981' : '#ef4444'),
                      display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                      {stat.pos !== undefined && <ArrowUpRight size={12} style={{ transform: stat.pos ? 'none' : 'rotate(90deg)' }} />}
                      {stat.sub}
                    </div>
                  </div>
                ))}
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }} className="grid-mobile-1">
                {/* Main Growth Chart */}
                <div className="card-premium" style={{ padding: '24px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Network Growth Dynamics</h3>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>LAST 7 DAYS</div>
                   </div>
                   <div style={{ height: '350px', width: '100%', minWidth: 0, position: 'relative' }}>
                      {overview?.salesTrend?.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={overview?.salesTrend}>
                            <defs>
                              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'var(--text-muted)'}} tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { weekday: 'short' })} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'var(--text-muted)'}} tickFormatter={(val) => `KSh ${val/1000}k`} />
                            <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="amount" stroke="var(--accent)" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Waiting for telemetry...</div>
                      )}
                   </div>
                </div>

                {/* Market Share */}
                <div className="card-premium" style={{ padding: '24px' }}>
                   <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '24px' }}>Payment Modality</h3>
                   <div style={{ height: '300px', width: '100%', minWidth: 0, position: 'relative' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={overview?.paymentBreakdown || []} innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value" nameKey="name">
                            {(overview?.paymentBreakdown || []).map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="transparent" />)}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Tab 2: MERCHANT FLEET */}
        {activeTab === 'businesses' && (
          <div className="fade-in">
             <div className="card-premium" style={{ padding: '0', overflow: 'hidden' }}>
               <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="grid-mobile-1">
                  <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Fleet Management</h3>
                  <div className="search-box-premium">
                    <Search size={16} color="var(--text-muted)" />
                    <input placeholder="Search identifier or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
               </div>
               
               <div style={{ overflowX: 'auto' }}>
                 <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                   <thead>
                     <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                       <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>MERCHANT</th>
                       <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>HEALTH</th>
                       <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>ACTIVITY</th>
                       <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'right' }}>VOLUME (KSh)</th>
                       <th style={{ padding: '16px 24px' }}></th>
                     </tr>
                   </thead>
                   <tbody>
                     {filteredBusinesses.map(b => (
                       <tr key={b.id} className="fleet-row" onClick={() => fetchBusinessDetail(b.id)}>
                         <td style={{ padding: '16px 24px' }}>
                           <div style={{ fontWeight: 700, fontSize: '14px' }}>{b.name}</div>
                           <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.owner_email}</div>
                         </td>
                         <td style={{ padding: '16px 24px' }}>
                           <span className={`badge-status status-${b.healthStatus.toLowerCase()}`}>
                             {b.healthStatus}
                           </span>
                           {b.is_suspended && (
                             <span className="badge-status" style={{ background: '#7f1d1d', color: '#fca5a5', marginLeft: '6px' }}>
                               SUSPENDED
                             </span>
                           )}
                         </td>
                         <td style={{ padding: '16px 24px' }}>
                            <div style={{ fontSize: '13px' }}>{b.sales_count} Sales</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              {b.daysSinceActivity === 0 ? 'Active today' : `${b.daysSinceActivity}d ago`}
                            </div>
                         </td>
                         <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 800, color: 'var(--accent)' }}>
                           {b.total_revenue?.toLocaleString()}
                         </td>
                         <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                           <ChevronRight size={18} color="var(--border)" />
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
          </div>
        )}

        {/* Tab 3: TELEMETRY */}
        {activeTab === 'activities' && (
          <div className="fade-in">
             <div className="card-premium" style={{ padding: '0' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
                   <h3 style={{ fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Activity size={20} color="var(--accent)" /> Real-time System Telemetry
                   </h3>
                </div>
                <div style={{ padding: '8px' }}>
                   {activities.length > 0 ? (
                     <div className="telemetry-grid">
                        {activities.map(act => (
                          <div key={act.id} className="telemetry-item">
                             <div className="telemetry-brand">{act.business_name}</div>
                             <div className="telemetry-content">
                                <span className="telemetry-qty">{act.quantity}x</span>
                                <span className="telemetry-prod">{act.product_name}</span>
                             </div>
                             <div className="telemetry-footer">
                                <span className="telemetry-val">KSh {parseFloat(act.total).toLocaleString()}</span>
                                <span className="telemetry-time">{new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                             </div>
                          </div>
                        ))}
                     </div>
                   ) : (
                     <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No live data detected.</div>
                   )}
                </div>
             </div>
          </div>
        )}

      </main>

      {/* Deep Dive Modal */}
      {showDetail && selectedBusiness && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
           <div className="side-panel-premium" onClick={e => e.stopPropagation()}>
              <div className="panel-header">
                <button className="btn-back" onClick={() => setShowDetail(false)}>
                  <ArrowLeft size={18} /> RETURN
                </button>
                <div style={{display: 'flex', gap: '8px'}}>
                  {selectedBusiness.business.is_suspended && (
                    <div className="status-pill" style={{background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)'}}>
                      SUSPENDED
                    </div>
                  )}
                  <div className={`status-pill ${selectedBusiness.business.subscription_status}`}>
                    {selectedBusiness.business.subscription_status?.toUpperCase()}
                  </div>
                </div>
              </div>
              
              <div style={{ padding: '32px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
                    <div className="business-avatar">
                       <Store size={32} color="var(--accent)" />
                    </div>
                    <div>
                       <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>{selectedBusiness.business.name}</h2>
                       <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>UID: {selectedBusiness.business.id.split('-')[0]}...</p>
                    </div>
                 </div>

                 <div className="panel-section">
                    <h4 className="section-title">PERFORMANCE TREND (30D)</h4>
                    <div style={{ height: '180px', marginBottom: '24px', width: '100%', minWidth: 0, position: 'relative' }}>
                       <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={selectedBusiness.revenueTrend}>
                           <Area type="monotone" dataKey="amount" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.1} strokeWidth={2} />
                           <Tooltip />
                         </AreaChart>
                       </ResponsiveContainer>
                    </div>
                 </div>

                 <div className="panel-section">
                    <h4 className="section-title">EQUITY LEADERS</h4>
                    <div className="top-products-list">
                       {selectedBusiness.topProducts.map((p, i) => (
                         <div key={i} className="top-product-item">
                            <span className="prod-name">{p.product_name}</span>
                            <span className="prod-rev">KSh {parseFloat(p.revenue).toLocaleString()}</span>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="panel-section">
                    <h4 className="section-title">RECENT LEDGER ENTRIES</h4>
                    <div className="recent-sales-list">
                       {selectedBusiness.recentSales.map((s, i) => (
                         <div key={i} className="sale-item">
                            <div className="sale-info">
                               <div className="sale-prod">{s.product_name}</div>
                               <div className="sale-time">{new Date(s.created_at).toLocaleString()}</div>
                            </div>
                            <div className="sale-total">KSh {parseFloat(s.total).toLocaleString()}</div>
                         </div>
                       ))}
                    </div>
                 </div>
                  {/* ACTION BAR */}
                  <div className="panel-section" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '32px' }}>
                     <button onClick={() => handleImpersonate(selectedBusiness.business.id)} className="btn-primary" style={{ flex: 1, minWidth: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                        <Globe size={16} /> Impersonate
                     </button>
                     <button onClick={() => handleExtendTrial(selectedBusiness.business.id)} className="btn-secondary" style={{ flex: 1, minWidth: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'var(--bg)', border: '1px solid var(--border)', cursor: 'pointer', borderRadius: '8px' }}>
                        <Clock size={16} /> Extend Trial
                     </button>
                     <button onClick={() => handleSuspendToggle(selectedBusiness.business.id, selectedBusiness.business.is_suspended)} className="btn-secondary" style={{ flex: 1, minWidth: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', borderRadius: '8px', background: selectedBusiness.business.is_suspended ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: selectedBusiness.business.is_suspended ? '#10b981' : '#ef4444', border: `1px solid ${selectedBusiness.business.is_suspended ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` }}>
                        <AlertCircle size={16} /> {selectedBusiness.business.is_suspended ? 'Reactivate' : 'Suspend'}
                     </button>
                  </div>

                  {/* CRM NOTES */}
                  <div className="panel-section">
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 className="section-title" style={{ margin: 0 }}>CRM NOTES (Auto-saves on action)</h4>
                     </div>
                     <textarea 
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Internal notes for this merchant..."
                        style={{ width: '100%', height: '80px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', color: 'var(--text)', fontSize: '13px', resize: 'vertical' }}
                     />
                  </div>

              </div>
           </div>
        </div>
      )}

      {/* Enhanced Styles */}
      <style>{`
        :root {
          --accent: #10b981;
          --surface: ${theme === 'dark' ? '#111827' : '#ffffff'};
          --bg: ${theme === 'dark' ? '#0B0F19' : '#F9FAFB'};
          --border: ${theme === 'dark' ? '#1F2937' : '#E5E7EB'};
          --text: ${theme === 'dark' ? '#F9FAFB' : '#111827'};
          --text-muted: ${theme === 'dark' ? '#9CA3AF' : '#6B7280'};
        }

        .card-premium {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          min-width: 0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .card-premium:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .search-box-premium {
          display: flex; align-items: center; gap: 10px;
          background: var(--bg); border: 1px solid var(--border);
          padding: 8px 16px; border-radius: 12px; width: 300px;
        }
        .search-box-premium input {
          background: transparent; border: none; outline: none; color: var(--text); font-size: 13px; width: 100%;
        }

        .fleet-row {
          border-bottom: 1px solid var(--border);
          cursor: pointer;
          transition: background 0.2s;
        }
        .fleet-row:hover { background: rgba(16, 185, 129, 0.03); }

        .badge-status {
          padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 800; letter-spacing: 0.02em;
        }
        .status-healthy { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .status-at_risk { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .status-dormant { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .status-new { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }

        .btn-icon-premium {
          width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
          border-radius: 10px; background: var(--surface); border: 1px solid var(--border);
          color: var(--text-muted); cursor: pointer; transition: all 0.2s;
        }
        .btn-icon-premium:hover { background: var(--bg); color: var(--text); border-color: var(--text-muted); }

        .side-panel-premium {
          width: 520px; height: 100%; background: var(--surface);
          box-shadow: -10px 0 30px rgba(0,0,0,0.2);
          animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .business-avatar {
          width: 64px; height: 64px; border-radius: 18px; background: var(--bg);
          display: flex; align-items: center; justify-content: center; border: 1px solid var(--border);
        }
        .panel-header {
           padding: 24px; border-bottom: 1px solid var(--border);
           display: flex; justify-content: space-between; align-items: center;
        }

        .dot-pulse {
          width: 6px; height: 6px; border-radius: 50%; background: var(--accent);
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        .telemetry-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px;
        }
        .telemetry-item {
          padding: 16px; background: var(--bg); border: 1px solid var(--border); border-radius: 12px;
        }
        .telemetry-brand { font-size: 10px; font-weight: 800; color: var(--accent); margin-bottom: 8px; text-transform: uppercase; }
        .telemetry-content { display: flex; gap: 8px; font-weight: 700; margin-bottom: 12px; }
        .telemetry-qty { color: var(--text-muted); }
        .telemetry-footer { display: flex; justify-content: space-between; align-items: center; }
        .telemetry-val { font-size: 14px; fontWeight: 800; }
        .telemetry-time { font-size: 10px; color: var(--text-muted); }

        .top-product-item {
          display: flex; justify-content: space-between; padding: 12px; 
          background: var(--bg); border-radius: 8px; margin-bottom: 8px; font-size: 13px;
        }
        .sale-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 0; border-bottom: 1px dashed var(--border);
        }
        .sale-prod { font-weight: 700; font-size: 14px; }
        .sale-time { font-size: 10px; color: var(--text-muted); }
        .sale-total { font-weight: 800; }

        @media (max-width: 768px) {
          .grid-mobile-1 { grid-template-columns: 1fr !important; }
          .side-panel-premium { width: 100%; }
        }
      `}</style>
    </div>
  );
}
