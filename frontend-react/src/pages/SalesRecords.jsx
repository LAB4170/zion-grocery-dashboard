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

  const handleExport = () => {
    if (sales.length === 0) return;
    
    // Define headers
    const headers = ['ID', 'Product', 'Quantity', 'Amount', 'Method', 'Customer', 'Date'];
    
    // Map data to rows
    const rows = filteredSales.map(s => [
      s.id,
      s.productName,
      s.quantity,
      s.total,
      s.paymentMethod,
      s.customerName || 'N/A',
      new Date(s.createdAt).toLocaleString()
    ]);
    
    // Combine into CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `zion_sales_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
          <button onClick={handleExport} className="glass" style={{ padding: '10px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
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
                  <td data-label="ID" style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>#{sale.id.slice(0, 8)}</td>
                  <td className="product-name" style={{ fontWeight: 700 }}>{sale.productName}</td>
                  <td data-label="Qty">{sale.quantity}</td>
                  <td data-label="Amount" style={{ fontWeight: 800 }}>KSh {Number(sale.total).toLocaleString()}</td>
                  <td data-label="Method">
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
                  <td data-label="Customer">{sale.customerName || '—'}</td>
                  <td data-label="Date" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
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
