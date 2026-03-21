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
    <style jsx>{`
      .stat-card {
        padding: 24px;
        border-radius: var(--radius-lg);
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: var(--transition);
      }
      .stat-card:hover {
        transform: translateY(-4px);
        border-color: var(--accent);
      }
      .stat-title {
        display: block;
        font-size: 13px;
        font-weight: 700;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      }
      .stat-value {
        font-size: 28px;
        font-weight: 800;
        color: var(--text);
      }
      .stat-icon-wrapper {
        width: 52px;
        height: 52px;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `}</style>
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

      <style jsx>{`
        .dashboard {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .page-header {
          margin-bottom: 32px;
        }
        .page-header h1 {
          font-size: 32px;
          letter-spacing: -1px;
        }
        .page-header p {
          color: var(--text-muted);
          font-weight: 500;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 24px;
        }
        .dashboard-section {
          padding: 24px;
          border-radius: var(--radius-lg);
        }
        .dashboard-section h3 {
          font-size: 18px;
          margin-bottom: 20px;
        }
        .empty-placeholder {
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          font-style: italic;
          border: 1px dashed var(--border);
          border-radius: var(--radius-md);
        }
        @media (max-width: 900px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
