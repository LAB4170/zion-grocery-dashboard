import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, DollarSign, AlertCircle } from 'lucide-react';
import api from '../services/api';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="stat-card">
    <div className="stat-content">
      <p className="stat-title">{title}</p>
      <h3 className="stat-value">{value}</h3>
      {trend && <span className="stat-trend">{trend}</span>}
    </div>
    <div className="stat-icon" style={{ backgroundColor: `${color}15`, color: color }}>
      <Icon size={24} />
    </div>
    <style jsx>{`
      .stat-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        backdrop-filter: blur(10px);
        transition: transform 0.2s, border-color 0.2s;
      }
      .stat-card:hover {
        transform: translateY(-4px);
        border-color: rgba(255, 255, 255, 0.15);
      }
      .stat-title {
        color: #8F9BB3;
        font-size: 14px;
        margin-bottom: 8px;
        font-weight: 500;
      }
      .stat-value {
        color: #FFFFFF;
        font-size: 28px;
        font-weight: 700;
      }
      .stat-trend {
        font-size: 12px;
        color: #1CE783;
        margin-left: 4px;
      }
      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
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
        // Assuming the backend has a summary endpoint, if not we'll handle gracefully
        if (response.data) {
          setStats({
            totalSales: `KSh ${response.data.totalSales || 0}`,
            totalProducts: response.data.totalProducts || 0,
            lowStock: response.data.lowStockCount || 0,
            pendingDebts: `KSh ${response.data.pendingDebts || 0}`
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Welcome back, Chief</h1>
        <p>Here's what's happening today at Zion Grocery.</p>
      </header>

      <div className="stats-grid">
        <StatCard 
          title="Total Sales" 
          value={stats.totalSales} 
          icon={DollarSign} 
          color="#6B48FF" 
          trend="+12.5%" 
        />
        <StatCard 
          title="Active Products" 
          value={stats.totalProducts} 
          icon={Package} 
          color="#1CE783" 
        />
        <StatCard 
          title="Low Stock Items" 
          value={stats.lowStock} 
          icon={AlertCircle} 
          color="#FF4D4D" 
        />
        <StatCard 
          title="Pending Debts" 
          value={stats.pendingDebts} 
          icon={TrendingUp} 
          color="#FFD700" 
        />
      </div>

      <div className="dashboard-sections">
        <div className="recent-activity section">
          <h3>Recent Activity</h3>
          <div className="empty-state">
            <p>No recent activity detected.</p>
          </div>
        </div>
        <div className="top-products section">
          <h3>Top Selling Products</h3>
          <div className="empty-state">
            <p>Sales data will appear here.</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          padding: 32px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .dashboard-header {
          margin-bottom: 40px;
        }
        .dashboard-header h1 {
          font-size: 32px;
          font-weight: 700;
          color: #FFFFFF;
          margin-bottom: 8px;
        }
        .dashboard-header p {
          color: #8F9BB3;
          font-size: 16px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
          margin-bottom: 48px;
        }
        .dashboard-sections {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }
        .section {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 24px;
        }
        .section h3 {
          color: #FFFFFF;
          font-size: 18px;
          margin-bottom: 20px;
          font-weight: 600;
        }
        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: #8F9BB3;
          font-style: italic;
        }
        @media (max-width: 900px) {
          .dashboard-sections {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
