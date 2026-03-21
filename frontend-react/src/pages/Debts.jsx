import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Search, CreditCard, User, Phone, CheckCircle, AlertCircle, X, DollarSign, Wallet } from 'lucide-react';
import api from '../services/api';

export default function Debts() {
  const navigate = useNavigate();
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [paymentData, setPaymentData] = useState({ amount: '', payment_method: 'cash' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/debts');
      setDebts(data.data || []);
    } catch (err) {
      console.error('Failed to fetch debts', err);
    } finally {
      setLoading(false);
    }
  };

  const overdueDebts = debts.filter(d => {
    if (d.status === 'paid') return false;
    if (!d.dueDate) {
      // If no due date, consider overdue if older than 7 days
      const createdDate = new Date(d.createdAt);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return createdDate < sevenDaysAgo;
    }
    return new Date(d.dueDate) < new Date();
  });

  const handleOpenPayment = (debt) => {
    setSelectedDebt(debt);
    setPaymentData({ amount: debt.balance, payment_method: 'cash' });
    setIsModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/debts/${selectedDebt.id}/payment`, paymentData);
      setIsModalOpen(false);
      fetchDebts();
    } catch (err) {
      if (err.response?.status === 402) {
        alert(err.response.data.message);
        navigate('/app/settings');
      } else {
        alert(err.response?.data?.message || 'Payment recording failed');
      }
    }
  };

  const filteredDebts = debts.filter(d => 
    d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.customerPhone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: filteredDebts.reduce((sum, d) => sum + Number(d.amount), 0),
    pending: filteredDebts.reduce((sum, d) => sum + Number(d.balance), 0),
    recovered: filteredDebts.reduce((sum, d) => sum + Number(d.amountPaid), 0)
  };

  if (loading) return <div className="loading-state">Loading Credit Ledger...</div>;

  return (
    <div className="debts-page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1>Customer Debts</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Manage customer credit and payment collections.</p>
        </div>
        <div className="header-actions">
           <div className="search-box card-elevated" style={{ background: 'var(--surface)', border: 'none' }}>
             <Search size={18} style={{ color: 'var(--text-muted)' }} />
             <input 
               type="text" 
               placeholder="Search by customer name or phone..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
        <div className="main-ledger">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
             <div className="card-elevated" style={{ padding: '20px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Total Credit Issued</p>
                <p style={{ fontSize: '24px', fontWeight: 900 }}>KSh {stats.total.toLocaleString()}</p>
             </div>
             <div className="card-elevated" style={{ padding: '20px', borderLeft: '4px solid var(--danger)' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Pending Balance</p>
                <p style={{ fontSize: '24px', fontWeight: 900, color: 'var(--danger)' }}>KSh {stats.pending.toLocaleString()}</p>
             </div>
             <div className="card-elevated" style={{ padding: '20px', borderLeft: '4px solid var(--accent)' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Total Recovered</p>
                <p style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent)' }}>KSh {stats.recovered.toLocaleString()}</p>
             </div>
          </div>

          <div className="card-elevated" style={{ padding: '0', overflow: 'hidden' }}>
            <table className="pos-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Receipt</th>
                  <th>Amount</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDebts.length === 0 ? (
                  <tr><td colSpan="7" className="empty-row">No active debt records found.</td></tr>
                ) : (
                  filteredDebts.map(debt => (
                    <tr key={debt.id}>
                      <td data-label="Customer" style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: 32, height: 32, background: 'var(--bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 800, fontSize: '12px' }}>
                            {debt.customerName.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700 }}>{debt.customerName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{debt.customerPhone || 'No Phone'}</div>
                          </div>
                        </div>
                      </td>
                      <td data-label="Receipt">
                         {debt.saleId ? (
                           <button onClick={() => window.location.href=`/sales/history?id=${debt.saleId}`} className="glass" style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                             VIEW SALE
                           </button>
                         ) : (
                           <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MANUAL</span>
                         )}
                      </td>
                      <td data-label="Amount" style={{ fontWeight: 600 }}>KSh {Number(debt.amount).toLocaleString()}</td>
                      <td data-label="Paid" style={{ color: 'var(--accent)', fontWeight: 600 }}>KSh {Number(debt.amountPaid).toLocaleString()}</td>
                      <td data-label="Balance" style={{ color: 'var(--danger)', fontWeight: 800 }}>KSh {Number(debt.balance).toLocaleString()}</td>
                      <td data-label="Status">
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: '8px', 
                          fontSize: '11px', 
                          fontWeight: 700,
                          background: debt.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: debt.status === 'paid' ? 'var(--accent)' : 'var(--danger)',
                          textTransform: 'uppercase'
                        }}>
                          {debt.status}
                        </span>
                      </td>
                      <td data-label="Actions">
                        {debt.balance > 0 && (
                          <button onClick={() => handleOpenPayment(debt)} className="btn-primary" style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700 }}>
                            COLLECT
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="overdue-reminders">
           <div className="card-elevated" style={{ padding: '24px', height: '100%', position: 'sticky', top: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                 <AlertCircle size={20} style={{ color: 'var(--danger)' }} />
                 <h3 style={{ fontSize: '16px' }}>Debt Reminders</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 {overdueDebts.length === 0 ? (
                   <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
                      <CheckCircle size={32} style={{ margin: '0 auto 12px', color: 'var(--accent)' }} />
                      <p style={{ fontSize: '12px' }}>All accounts up to date.</p>
                   </div>
                 ) : (
                   overdueDebts.map(debt => (
                     <div key={debt.id} className="glass" style={{ padding: '16px', borderRadius: '16px', borderLeft: '4px solid var(--danger)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                           <span style={{ fontWeight: 800, fontSize: '13px' }}>{debt.customerName}</span>
                           <span style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 800 }}>OVERDUE</span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>Balance: KSh {debt.balance.toLocaleString()}</p>
                        <button 
                          onClick={() => handleOpenPayment(debt)}
                          style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'var(--bg)', color: 'var(--danger)', fontSize: '11px', fontWeight: 800, border: '1px solid var(--border)' }}
                        >
                          CONTACT CUSTOMER
                        </button>
                     </div>
                   ))
                 )}
              </div>
           </div>
        </aside>
      </div>

      {isModalOpen && (
        <div className="modal-overlay glass" style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
          <div className="card-elevated" style={{ width: '100%', maxWidth: '400px', padding: '32px', position: 'relative' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <h2 style={{ marginBottom: '8px', fontSize: '20px' }}>Clear Debt</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>Processing payment for <strong>{selectedDebt?.customerName}</strong></p>
            
            <form onSubmit={handleRecordPayment} style={{ display: 'grid', gap: '20px' }}>
              <div className="input-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><DollarSign size={14} /> Payment Amount</label>
                <input 
                  type="number" 
                  value={paymentData.amount} 
                  onChange={e => setPaymentData({...paymentData, amount: e.target.value})} 
                  required 
                  max={selectedDebt?.balance}
                />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Max: KSh {Number(selectedDebt?.balance).toLocaleString()}</p>
              </div>
              
              <div className="input-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Wallet size={14} /> Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                   <button 
                     type="button" 
                     onClick={() => setPaymentData({...paymentData, payment_method: 'cash'})} 
                     className={paymentData.payment_method === 'cash' ? 'btn-select active' : 'btn-select'}
                   >
                     Cash
                   </button>
                   <button 
                     type="button" 
                     onClick={() => setPaymentData({...paymentData, payment_method: 'mpesa'})} 
                     className={paymentData.payment_method === 'mpesa' ? 'btn-select active' : 'btn-select'}
                   >
                     M-Pesa
                   </button>
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ padding: '14px', fontSize: '16px', marginTop: '12px' }}>
                Complete Payment
              </button>
            </form>
          </div>
        </div>
      )}

      <style jsx="true">{`
        .btn-select {
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--text-muted);
          padding: 10px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          transition: var(--transition);
        }
        .btn-select.active {
          background: var(--accent);
          color: white;
          border-color: var(--accent);
        }
      `}</style>
    </div>
  );
}
