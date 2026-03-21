import { useState, useEffect } from 'react';
import { 
  TrendingUp, Package, DollarSign, AlertCircle, 
  ArrowUpRight, ArrowDownRight, ShoppingCart 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

const StatCard = ({ title, value, icon: Icon, color, trend, trendValue, subtitle }) => (
  <div className="card-elevated" style={{ padding: '24px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <span className="stat-title">{title}</span>
        <h3 className="stat-value" style={{ margin: '8px 0' }}>{value}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
          {trend === 'up' ? (
            <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>
              <ArrowUpRight size={14} /> +{trendValue}%
            </span>
          ) : (
            <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center' }}>
              <ArrowDownRight size={14} /> -{trendValue}%
            </span>
          )}
          <span style={{ color: 'var(--text-muted)' }}>{subtitle || 'vs last week'}</span>
        </div>
      </div>
      <div className="stat-icon-wrapper" style={{ backgroundColor: `${color}15`, color: color }}>
        <Icon size={24} />
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  const fetchDashboardData = async () => {
    try {
      const [statsRes, chartsRes, activitiesRes, alertsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/charts'),
        api.get('/dashboard/recent-activities'),
        api.get('/dashboard/alerts')
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (chartsRes.data.success) {
        setChartData(chartsRes.data.data.daily_sales || []);
        setCategoryData(chartsRes.data.data.expenses_by_category || []);
      }
      if (activitiesRes.data.success) setRecentActivities(activitiesRes.data.data);
      if (alertsRes.data.success) setAlerts(alertsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    if (socket) {
      socket.on('data-update', (data) => {
        console.log('🔄 Dashboard received real-time update:', data);
        fetchDashboardData();
      });

      socket.on('data-refresh', () => fetchDashboardData());
    }

    return () => {
      if (socket) {
        socket.off('data-update');
        socket.off('data-refresh');
      }
    };
  }, [socket]);

  if (loading) return <div className="loading-state">Syncing real-time analytics...</div>;

  return (
    <div className="dashboard">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1>Dashboard Overview</h1>
          <p>Real-time analytics for Zion Grocery.</p>
        </div>
        <div className="glass" style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>
          Live • Last updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </header>

      <div className="stats-grid">
        <StatCard 
          title="Total Sales" 
          value={`KSh ${(stats?.sales?.total_revenue || 0).toLocaleString()}`} 
          icon={DollarSign} 
          color="#10B981" 
          trend="up" 
          trendValue="12.5" 
          subtitle="All time growth"
        />
        <StatCard 
          title="Monthly Revenue" 
          value={`KSh ${(stats?.sales?.monthly_revenue || 0).toLocaleString()}`} 
          icon={TrendingUp} 
          color="#3B82F6" 
          trend="up" 
          trendValue="4.2" 
          subtitle="vs last month"
        />
        <StatCard 
          title="Low Stock" 
          value={stats?.inventory?.low_stock_count || 0} 
          icon={AlertCircle} 
          color="#EF4444" 
          trend="down" 
          trendValue="2.1" 
          subtitle="Alert items"
        />
        <StatCard 
          title="Total Debts" 
          value={`KSh ${(stats?.debts?.total_outstanding || 0).toLocaleString()}`} 
          icon={Package} 
          color="#F59E0B" 
          trend="up" 
          trendValue="8.4" 
          subtitle="Outstanding"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <section className="card-elevated" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px' }}>Revenue Performance</h3>
            <div className="glass" style={{ padding: '4px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
              Last 7 Days
            </div>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(str) => new Date(str).toLocaleDateString([], { weekday: 'short' })} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `KSh ${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)' }}
                  itemStyle={{ color: 'var(--text)', fontWeight: 600 }}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Area type="monotone" dataKey="total_sales" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card-elevated" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '24px' }}>Expense Distribution</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={categoryData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="category" type="category" stroke="var(--text)" fontSize={11} tickLine={false} axisLine={false} width={80} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="total_amount" radius={[0, 4, 4, 0]} fill="var(--accent-secondary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: '20px', maxHeight: '120px', overflowY: 'auto' }}>
            {categoryData.slice(0, 4).map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-secondary)' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>{item.category}</span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>KSh {Number(item.total_amount).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-section glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Recent Activities</h3>
            <button className="btn-text" style={{ color: 'var(--accent)', fontSize: '13px', fontWeight: 700 }}>View Records</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             {recentActivities.length === 0 ? <p className="empty-placeholder">No activities found.</p> : recentActivities.slice(0, 5).map((act, i) => (
               <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                 <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: act.type === 'sale' ? 'var(--accent)' : 'var(--danger)' }}>
                      {act.type === 'sale' ? <ShoppingCart size={18} /> : <ArrowDownRight size={18} />}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px' }}>{act.description}</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                 </div>
                 <div style={{ textAlign: 'right' }}>
                   <p style={{ fontWeight: 800, fontSize: '15px' }}>KSh {Number(act.amount).toLocaleString()}</p>
                   <span style={{ fontSize: '11px', color: act.type === 'sale' ? 'var(--accent)' : 'var(--danger)', fontWeight: 700, textTransform: 'uppercase' }}>{act.type}</span>
                 </div>
               </div>
             ))}
          </div>
        </section>

        <section className="dashboard-section glass">
          <h3>System Alerts</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             {alerts.length === 0 ? <p className="empty-placeholder">All systems healthy.</p> : alerts.map((alert, i) => (
               <div key={i} className="glass" style={{ padding: '12px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                   <div style={{ color: alert.type === 'error' ? 'var(--danger)' : 'var(--accent-secondary)' }}><AlertCircle size={18} /></div>
                   <div>
                     <p style={{ fontSize: '14px', fontWeight: 700 }}>{alert.title}</p>
                     <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{alert.message}</p>
                   </div>
                 </div>
                 <button style={{ padding: '6px 12px', background: 'var(--surface-hover)', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>Manage</button>
               </div>
             ))}
          </div>
        </section>
      </div>
    </div>
  );
}
