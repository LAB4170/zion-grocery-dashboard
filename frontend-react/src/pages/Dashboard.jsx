import { useState, useEffect } from 'react';
import { TrendingUp, Package, DollarSign, AlertCircle } from 'lucide-react';
import api from '../services/api';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="stat-card glass">
    <div className="stat-info">
      <span className="stat-title">{title}</span>
      <h3 className="stat-value">{value}</h3>
    </div>
    <div className="stat-icon-wrapper" style={{ backgroundColor: `${color}10`, color: color }}>
      <Icon size={24} />
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 'KSh 0',
    totalProducts: '0',
    lowStock: '0',
    pendingDebts: 'KSh 0'
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/summary');
        if (response.data) {
          setStats({
            totalSales: `KSh ${(response.data.totalSales || 0).toLocaleString()}`,
            totalProducts: response.data.totalProducts || 0,
            lowStock: response.data.lowStockCount || 0,
            pendingDebts: `KSh ${(response.data.pendingDebts || 0).toLocaleString()}`
          });
        }
      } catch (_error) {
        // Silently handle or show a small toast in real app
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="dashboard">
      <header className="page-header">
        <h1>Dashboard Overview</h1>
        <p>Real-time analytics for Zion Grocery.</p>
      </header>

      <div className="stats-grid">
        <StatCard title="Total Sales" value={stats.totalSales} icon={DollarSign} color="#10B981" />
        <StatCard title="Inventory" value={stats.totalProducts} icon={Package} color="#3B82F6" />
        <StatCard title="Low Stock" value={stats.lowStock} icon={AlertCircle} color="#EF4444" />
        <StatCard title="Total Debts" value={stats.pendingDebts} icon={TrendingUp} color="#F59E0B" />
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-section glass">
          <h3>Recent Transactions</h3>
          <div className="empty-placeholder">
            <p>No transactions recorded today.</p>
          </div>
        </section>
        <section className="dashboard-section glass">
          <h3>Stock Alerts</h3>
          <div className="empty-placeholder">
            <p>All inventory levels are healthy.</p>
          </div>
        </section>
      </div>

    </div>
  );
}
