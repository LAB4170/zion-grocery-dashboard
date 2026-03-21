import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Package, 
  ShoppingCart, Wallet, CreditCard, Users, ArrowUpRight
} from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socket = useSocket();

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [statsRes, chartsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/charts')
      ]);
      
      setData({
        stats: statsRes.data.data,
        charts: chartsRes.data.data
      });
    } catch (err) {
      console.error('Failed to fetch reports', err);
      setError(err.message || 'Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    if (socket) {
      socket.on('data-update', fetchReports);
      socket.on('data-refresh', fetchReports);
    }
    return () => {
      if (socket) {
        socket.off('data-update');
        socket.off('data-refresh');
      }
    };
  }, [socket]);

  if (loading) return <div className="loading-state">Generating Financial Insights...</div>;
  if (error) return <div className="error-state" style={{ color: 'var(--danger)', padding: '40px', textAlign: 'center' }}>{error}</div>;
  if (!data || !data.stats || !data.charts) return <div className="error-state" style={{ padding: '40px', textAlign: 'center' }}>No report data available.</div>;

  const { stats, charts } = data;
  const netProfit = (stats?.sales?.total_revenue || 0) - (stats?.expenses?.total_expenses || 0);
  
  const paymentData = [
    { name: 'Cash', value: stats?.sales?.cash_sales || 0 },
    { name: 'M-Pesa', value: stats?.sales?.mpesa_sales || 0 },
    { name: 'Debt', value: stats?.sales?.debt_sales || 0 }
  ].filter(d => d.value > 0);

  return (
    <div className="reports-page">
      <header className="page-header">
        <h1>Financial Intelligence</h1>
        <p style={{ color: 'var(--text-muted)' }}>Real-time auditing and performance reporting.</p>
      </header>

      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <div className="card-elevated" style={{ padding: '24px', borderLeft: '4px solid var(--accent)' }}>
          <span className="stat-title">Net Profitability</span>
          <h2 style={{ fontSize: '28px', color: netProfit >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
            KSh {(netProfit || 0).toLocaleString()}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Revenue minus all recorded expenses</p>
        </div>
        
        <div className="card-elevated" style={{ padding: '24px' }}>
          <span className="stat-title">Inventory Valuation</span>
          <h2 style={{ fontSize: '28px' }}>KSh {(stats?.inventory?.total_valuation || 0).toLocaleString()}</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Real-time asset value on shelves</p>
        </div>

        <div className="card-elevated" style={{ padding: '24px' }}>
          <span className="stat-title">Recovery Rate</span>
          <h2 style={{ fontSize: '28px', color: 'var(--accent-secondary)' }}>
            {Math.round(((stats?.debts?.total_outstanding || 0) / (stats?.sales?.total_revenue || 1)) * 100)}%
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Debt to Revenue ratio</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
         <section className="card-elevated" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '24px', fontSize: '18px' }}>Payment Method Mix</h3>
            <div style={{ width: '100%', height: 300 }}>
               <ResponsiveContainer>
                 <PieChart>
                   <Pie
                     data={paymentData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={100}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {paymentData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <Tooltip />
                 </PieChart>
               </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '16px' }}>
               {paymentData.map((d, i) => (
                 <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <div style={{ width: 12, height: 12, borderRadius: '3px', background: COLORS[i] }} />
                   <span style={{ fontSize: '12px', fontWeight: 600 }}>{d.name}</span>
                 </div>
               ))}
            </div>
         </section>

         <section className="card-elevated" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '24px', fontSize: '18px' }}>Sales vs Expenses Trend</h3>
            <div style={{ width: '100%', height: 300 }}>
               <ResponsiveContainer>
                  <AreaChart data={charts?.daily_sales || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="date" hide />
                    <YAxis hide />
                    <Tooltip />
                    <Area type="monotone" dataKey="total_sales" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.1} strokeWidth={3} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </section>
      </div>

      <div className="card-elevated" style={{ padding: '24px' }}>
         <h3 style={{ marginBottom: '20px' }}>Inventory Health Report</h3>
         <table className="pos-table">
            <thead>
               <tr>
                  <th>Product</th>
                  <th>Stock Level</th>
                  <th>Status</th>
                  <th>Valuation (Est)</th>
               </tr>
            </thead>
            <tbody>
               {(stats?.inventory?.low_stock_products || []).map((p, i) => (
                 <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{p.stock} units</td>
                    <td>
                       <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontWeight: 800 }}>CRITICAL</span>
                    </td>
                    <td style={{ fontWeight: 700 }}>KSh {((p.stock || 0) * 150).toLocaleString()}</td>
                 </tr>
               ))}
               {(stats?.inventory?.low_stock_count === 0 || !stats?.inventory?.low_stock_products?.length) && (
                 <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>All inventory levels are healthy.</td></tr>
               )}
            </tbody>
         </table>
      </div>
    </div>
  );
}
