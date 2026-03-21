import { useState, useEffect } from 'react';
import { Search, Calendar, Filter, Eye, Download, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

export default function SalesRecords() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const socket = useSocket();

  const fetchSales = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/sales');
      setSales(data.data || []);
    } catch (err) {
      console.error('Failed to fetch sales', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
    if (socket) {
      socket.on('data-update', fetchSales);
      socket.on('data-refresh', fetchSales);
    }
    return () => {
      if (socket) {
        socket.off('data-update');
        socket.off('data-refresh');
      }
    };
  }, [socket]);

  const filteredSales = sales.filter(s => 
    s.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toString().includes(searchTerm)
  );

  if (loading) return <div className="loading-state">Syncing Ledger...</div>;

  return (
    <div className="sales-records">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Sales Ledger</h1>
          <p style={{ color: 'var(--text-muted)' }}>Complete audit history for all transactions.</p>
        </div>
        <div className="header-actions">
           <div className="search-box card-elevated" style={{ background: 'var(--surface)', border: 'none' }}>
             <Search size={18} style={{ color: 'var(--text-muted)' }} />
             <input 
               type="text" 
               placeholder="Search by ID, product, or customer..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <button className="glass" style={{ padding: '10px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <Download size={18} /> Export CSV
          </button>
        </div>
      </header>

      <div className="card-elevated" style={{ overflow: 'hidden', padding: '0' }}>
        <table className="pos-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Customer</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.length === 0 ? (
              <tr><td colSpan="7" className="empty-row">No sales found matching your criteria.</td></tr>
            ) : (
              filteredSales.map(sale => (
                <tr key={sale.id} className="row-hover">
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>#{sale.id.slice(0, 8)}</td>
                  <td style={{ fontWeight: 700 }}>{sale.productName}</td>
                  <td>{sale.quantity}</td>
                  <td style={{ fontWeight: 800 }}>KSh {Number(sale.total).toLocaleString()}</td>
                  <td>
                     <span style={{ 
                       padding: '4px 10px', 
                       borderRadius: '6px', 
                       fontSize: '11px', 
                       background: 'var(--bg)', 
                       textTransform: 'uppercase', 
                       fontWeight: 800,
                       color: sale.paymentMethod === 'mpesa' ? 'var(--accent-secondary)' : 'var(--text)'
                     }}>
                       {sale.paymentMethod}
                     </span>
                  </td>
                  <td>{sale.customerName || '—'}</td>
                  <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {new Date(sale.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style jsx="true">{`
        .row-hover:hover {
          background: var(--surface-hover);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
