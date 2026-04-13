import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightLeft, Plus, Search, Trash2, X, Tag, DollarSign, Calendar, FileText } from 'lucide-react';
import api from '../services/api';

export default function Expenses() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ description: '', amount: '', category: 'Utilities' });
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['Utilities', 'Rent', 'Salaries', 'Supplies', 'Transport', 'Marketing', 'Other'];

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/expenses');
      setExpenses(data.data || []);
    } catch (err) {
      console.error('Failed to fetch expenses', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses', formData);
      setIsModalOpen(false);
      setFormData({ description: '', amount: '', category: 'Utilities' });
      fetchExpenses();
    } catch (err) {
      if (err.response?.status === 402) {
        alert(err.response.data.message);
        navigate('/app/settings');
      } else {
        alert(err.response?.data?.message || 'Failed to record expense');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense record?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses();
    } catch (err) {
      if (err.response?.status === 402) {
        alert(err.response.data.message);
        navigate('/app/settings');
      } else {
        alert('Delete failed');
      }
    }
  };

  const filteredExpenses = expenses.filter(ex => 
    ex.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ex.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpenses = filteredExpenses.reduce((sum, ex) => sum + Number(ex.amount), 0);

  if (loading) return <div className="loading-state">Syncing Ledger...</div>;

  return (
    <div className="expenses-page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1>Business Expenses</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Track and categorize your operating costs.</p>
        </div>
        <div className="header-actions">
           <div className="search-box card-elevated" style={{ background: 'var(--surface)', border: 'none' }}>
             <Search size={18} style={{ color: 'var(--text-muted)' }} />
             <input 
               type="text" 
               placeholder="Search expenses..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
            <Plus size={20} /> Record Expense
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
        <div className="card-elevated" style={{ padding: '0', overflow: 'hidden' }}>
          <table className="pos-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr><td colSpan="5" className="empty-row">No expenses recorded for this period.</td></tr>
              ) : (
                filteredExpenses.map(ex => (
                  <tr key={ex.id}>
                    <td data-label="Description" style={{ padding: '16px 24px', fontWeight: 600 }}>{ex.description}</td>
                    <td data-label="Category">
                       <span style={{ 
                         background: 'var(--bg)', 
                         padding: '4px 10px', 
                         borderRadius: '6px', 
                         fontSize: '12px',
                         color: 'var(--text-muted)',
                         fontWeight: 700
                       }}>
                         {ex.category}
                       </span>
                    </td>
                    <td data-label="Amount" style={{ fontWeight: 800, color: 'var(--danger)' }}>KSh {Number(ex.amount).toLocaleString()}</td>
                    <td data-label="Date" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                      {new Date(ex.createdAt).toLocaleDateString()}
                    </td>
                    <td data-label="Actions">
                       <button onClick={() => handleDelete(ex.id)} style={{ color: 'var(--danger)', opacity: 0.6 }}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <aside>
           <div className="card-elevated" style={{ padding: '24px', position: 'sticky', top: '24px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--text-muted)' }}>Financial Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 <div className="glass" style={{ padding: '16px', borderRadius: '12px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Outflow</p>
                    <p style={{ fontSize: '24px', fontWeight: 900, color: 'var(--danger)' }}>KSh {totalExpenses.toLocaleString()}</p>
                 </div>
                 <div className="glass" style={{ padding: '16px', borderRadius: '12px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Entries</p>
                    <p style={{ fontSize: '20px', fontWeight: 800 }}>{filteredExpenses.length} Records</p>
                 </div>
              </div>
           </div>
        </aside>
      </div>

      {isModalOpen && (
        <div className="modal-overlay glass" style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
          <div className="card-elevated" style={{ width: '100%', maxWidth: '440px', padding: '32px', position: 'relative' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <h2 style={{ marginBottom: '24px', fontSize: '24px' }}>Record Expense</h2>
            
            <form onSubmit={handleAddExpense} style={{ display: 'grid', gap: '20px' }}>
              <div className="input-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={14} /> Description</label>
                <input 
                  type="text" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  required 
                  placeholder="e.g. Electricity Bill - March"
                />
              </div>
              
              <div className="input-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Tag size={14} /> Category</label>
                <select 
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><DollarSign size={14} /> Amount (KSh)</label>
                <input 
                  type="number" 
                  value={formData.amount} 
                  onChange={e => setFormData({...formData, amount: e.target.value})} 
                  required 
                />
              </div>

              <button type="submit" className="btn-primary" style={{ padding: '14px', fontSize: '16px', marginTop: '12px' }}>
                Save Expense
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
