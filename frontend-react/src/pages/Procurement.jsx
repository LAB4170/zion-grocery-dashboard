import { useState, useEffect } from 'react';
import { 
  Users, Truck, Plus, Package, History, Search, 
  Phone, Mail, MapPin, CheckCircle, AlertCircle, 
  ArrowRight, ShoppingBag, DollarSign, X
} from 'lucide-react';
import api from '../services/api';

export default function Procurement() {
  const [activeTab, setActiveTab] = useState('suppliers');
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [poHistory, setPoHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  // Form States
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', contact_person: '', phone: '', email: '', category: '', address: '' });
  
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [restockCart, setRestockCart] = useState([]);
  const [refNumber, setRefNumber] = useState('');

  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
    fetchHistory();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data } = await api.get('/procurement/suppliers');
      setSuppliers(data.data);
    } catch (err) { console.error(err); }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data.data);
    } catch (err) { console.error(err); }
  };

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/procurement/history');
      setPoHistory(data.data);
    } catch (err) { console.error(err); }
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await api.post('/procurement/suppliers', newSupplier);
      setSuccessMessage('Supplier added successfully!');
      setShowSupplierModal(false);
      setNewSupplier({ name: '', contact_person: '', phone: '', email: '', category: '', address: '' });
      fetchSuppliers();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError('Failed to add supplier.');
    } finally {
      setIsProcessing(false);
    }
  };

  const addToRestock = (product) => {
    if (restockCart.find(i => i.productId === product.id)) return;
    setRestockCart([...restockCart, { 
      productId: product.id, 
      name: product.name, 
      quantity: 1, 
      unitCost: product.unitCost || 0 
    }]);
  };

  const updateRestockItem = (id, field, value) => {
    setRestockCart(restockCart.map(item => 
      item.productId === id ? { ...item, [field]: value } : item
    ));
  };

  const removeRestockItem = (id) => {
    setRestockCart(restockCart.filter(i => i.productId !== id));
  };

  const handleReceiveOrder = async () => {
    if (!selectedSupplier || restockCart.length === 0) {
      setError('Please select a supplier and at least one item.');
      return;
    }
    setIsProcessing(true);
    setError('');
    try {
      const payload = {
        supplierId: selectedSupplier,
        referenceNumber: refNumber,
        items: restockCart.map(item => ({
          ...item,
          quantity: parseFloat(item.quantity || 0),
          unitCost: parseFloat(item.unitCost || 0)
        })),
        notes: ''
      };
      await api.post('/procurement/receive', payload);
      setSuccessMessage('Stock received! Inventory and Expenses updated.');
      setRestockCart([]);
      setRefNumber('');
      setSelectedSupplier('');
      fetchProducts();
      fetchHistory();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError('Failed to receive order.');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalPO = restockCart.reduce((sum, i) => sum + (parseFloat(i.unitCost || 0) * parseFloat(i.quantity || 0)), 0);

  return (
    <div className="procurement-page" style={{ padding: '24px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Procurement & Supply Chain</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage vendors and restock your inventory professionally.</p>
      </header>

      {/* Tabs */}
      <div className="tabs glass" style={{ display: 'flex', gap: '8px', padding: '8px', borderRadius: '16px', marginBottom: '32px', width: 'fit-content' }}>
        <button onClick={() => setActiveTab('suppliers')} className={activeTab === 'suppliers' ? 'tab-btn active' : 'tab-btn'}>
           <Users size={18} /> Suppliers
        </button>
        <button onClick={() => setActiveTab('restock')} className={activeTab === 'restock' ? 'tab-btn active' : 'tab-btn'}>
           <Truck size={18} /> Restock Wizard
        </button>
        <button onClick={() => setActiveTab('history')} className={activeTab === 'history' ? 'tab-btn active' : 'tab-btn'}>
           <History size={18} /> Receipt History
        </button>
      </div>

      {successMessage && <div className="glass" style={{ padding: '12px 24px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}><CheckCircle size={20} /> {successMessage}</div>}
      {error && <div className="glass" style={{ padding: '12px 24px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}><AlertCircle size={20} /> {error}</div>}

      {/* TAB: SUPPLIERS */}
      {activeTab === 'suppliers' && (
        <section className="suppliers-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2>Supplier Directory ({suppliers.length})</h2>
            <button className="btn-primary" onClick={() => setShowSupplierModal(true)}>
              <Plus size={18} /> Add Supplier
            </button>
          </div>

          <div className="suppliers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
             {suppliers.length === 0 ? (
               <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', borderRadius: '24px', background: 'var(--surface)' }}>
                  <Users size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                  <p>No suppliers registered yet.</p>
               </div>
             ) : suppliers.map(s => (
               <div key={s.id} className="card-elevated" style={{ padding: '24px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                       <Truck size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '18px' }}>{s.name}</h3>
                      <span style={{ fontSize: '11px', background: 'var(--bg)', padding: '2px 8px', borderRadius: '10px', color: 'var(--text-muted)' }}>{s.category || 'General'}</span>
                    </div>
                 </div>
                 <div className="supplier-details" style={{ fontSize: '13px', display: 'grid', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}><Phone size={14} /> {s.phone || 'N/A'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}><Mail size={14} /> {s.email || 'N/A'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}><MapPin size={14} /> {s.address || 'N/A'}</div>
                 </div>
               </div>
             ))}
          </div>
        </section>
      )}

      {/* TAB: RESTOCK WIZARD */}
      {activeTab === 'restock' && (
        <section className="restock-section" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
          <div className="card-elevated" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
               <h3>Step 1: Select Items for Restocking</h3>
               <div className="search-box card-elevated" style={{ width: '250px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
                 <Search size={16} />
                 <input type="text" placeholder="Filter items..." />
               </div>
            </div>

            <div className="products-selection" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', maxHeight: '500px', overflowY: 'auto' }}>
              {products.map(p => (
                <div key={p.id} className="card-elevated" style={{ padding: '16px', borderRadius: '16px', cursor: 'pointer', background: 'var(--surface)' }} onClick={() => addToRestock(p)}>
                  <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', color: 'var(--text)' }}>{p.name}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '12px' }}>
                    <span style={{ color: p.stockQuantity < 5 ? 'var(--danger)' : 'var(--text-muted)' }}>In Stock: {p.stockQuantity}</span>
                    <button style={{ color: 'var(--accent)' }}><Plus size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-elevated" style={{ padding: '24px', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '20px' }}>Step 2: Reception Details</h3>
            
            <div className="input-group" style={{ marginBottom: '16px' }}>
              <label>Vendor / Supplier</label>
              <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)}>
                <option value="">Select a vendor...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: '24px' }}>
              <label>Delivery Note / LPO Ref</label>
              <input type="text" placeholder="e.g. DN-2024-001" value={refNumber} onChange={(e) => setRefNumber(e.target.value)} />
            </div>

            <h4 style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>Batch Items ({restockCart.length})</h4>
            <div className="restock-cart" style={{ flex: 1, overflowY: 'auto', marginBottom: '24px' }}>
               {restockCart.map(i => (
                 <div key={i.productId} className="card-elevated" style={{ padding: '16px', borderRadius: '16px', marginBottom: '16px', background: 'var(--surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                       <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)' }}>{i.name}</span>
                       <button onClick={() => removeRestockItem(i.productId)} style={{ color: 'var(--danger)' }}><ArrowRight size={14} /></button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                       <div className="input-group">
                          <label style={{ fontSize: '10px' }}>Qty Received</label>
                          <input type="number" value={i.quantity} onChange={(e) => updateRestockItem(i.productId, 'quantity', e.target.value)} />
                       </div>
                       <div className="input-group">
                          <label style={{ fontSize: '10px' }}>Unit Cost (KSh)</label>
                          <input type="number" value={i.unitCost} onChange={(e) => updateRestockItem(i.productId, 'unitCost', e.target.value)} />
                       </div>
                    </div>
                 </div>
               ))}
               {restockCart.length === 0 && <p style={{ fontSize: '12px', textAlign: 'center', opacity: 0.5, marginTop: '40px' }}>No items selected for restock.</p>}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginBottom: '24px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>Invoice Total:</span>
                  <span style={{ fontSize: '20px', fontWeight: 900 }}>KSh {totalPO.toLocaleString()}</span>
               </div>
            </div>

            <button className="btn-primary" style={{ width: '100%', padding: '16px' }} disabled={isProcessing || restockCart.length === 0} onClick={handleReceiveOrder}>
               {isProcessing ? 'Processing Batch...' : 'Receive Stock & Update Ledger'}
            </button>
          </div>
        </section>
      )}

      {/* TAB: HISTORY */}
      {activeTab === 'history' && (
        <section className="history-section">
          <div className="card-elevated" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead style={{ background: 'var(--bg)' }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '16px' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '16px' }}>Supplier</th>
                    <th style={{ textAlign: 'left', padding: '16px' }}>Reference</th>
                    <th style={{ textAlign: 'right', padding: '16px' }}>Amount</th>
                    <th style={{ textAlign: 'center', padding: '16px' }}>Status</th>
                  </tr>
               </thead>
               <tbody>
                  {poHistory.map(po => (
                    <tr key={po.id} style={{ borderBottom: '1px solid var(--border)' }}>
                       <td style={{ padding: '16px' }}>{new Date(po.created_at).toLocaleDateString()}</td>
                       <td style={{ padding: '16px', fontWeight: 600 }}>{po.supplier_name}</td>
                       <td style={{ padding: '16px' }}><code style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: '4px' }}>{po.reference_number}</code></td>
                       <td style={{ padding: '16px', textAlign: 'right', fontWeight: 800 }}>KSh {parseFloat(po.total_amount).toLocaleString()}</td>
                       <td style={{ padding: '16px', textAlign: 'center' }}>
                          <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent)', padding: '4px 10px', borderRadius: '20px', fontWeight: 700 }}>RECEIVED</span>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
          </div>
        </section>
      )}

      {/* MODAL: ADD SUPPLIER - PREMIUM REDESIGN */}
      {showSupplierModal && (
        <div className="modal-overlay" style={{ 
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', 
          backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', 
          alignItems: 'center', justifyContent: 'center', padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
           <div className="glass modal-content" style={{ 
             padding: '40px', borderRadius: '28px', width: '100%', maxWidth: '600px',
             boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.05)',
             background: 'var(--surface)',
             position: 'relative',
             border: '1px solid var(--glass-border)',
             animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
           }}>
              <button 
                onClick={() => setShowSupplierModal(false)}
                style={{ position: 'absolute', top: '24px', right: '24px', background: 'var(--border)', color: 'var(--text)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} />
              </button>

              <div style={{ marginBottom: '32px' }}>
                 <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '8px', color: 'var(--text)' }}>New Vendor Partner</h2>
                 <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Establish a new supply relationship in your inventory system.</p>
              </div>

              <form onSubmit={handleAddSupplier} style={{ display: 'grid', gap: '20px' }}>
                 <div className="input-group">
                    <label>Company Name <span style={{ color: 'var(--accent)' }}>*</span></label>
                    <div className="input-wrapper">
                      <Truck size={16} className="input-icon" />
                      <input type="text" required placeholder="e.g. Zion Groceries LTD" value={newSupplier.name} onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})} />
                    </div>
                 </div>

                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="input-group">
                        <label>Contact Person</label>
                        <div className="input-wrapper">
                          <Users size={16} className="input-icon" />
                          <input type="text" placeholder="Full name" value={newSupplier.contact_person} onChange={(e) => setNewSupplier({...newSupplier, contact_person: e.target.value})} />
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Phone Number</label>
                        <div className="input-wrapper">
                          <Phone size={16} className="input-icon" />
                          <input type="text" placeholder="+254..." value={newSupplier.phone} onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})} />
                        </div>
                    </div>
                 </div>

                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="input-group">
                      <label>Email Address</label>
                      <div className="input-wrapper">
                        <Mail size={16} className="input-icon" />
                        <input type="email" placeholder="vendor@example.com" value={newSupplier.email} onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})} />
                      </div>
                    </div>
                    <div className="input-group">
                      <label>Category</label>
                      <div className="input-wrapper">
                        <ShoppingBag size={16} className="input-icon" />
                        <input type="text" placeholder="e.g. Dry Goods" value={newSupplier.category} onChange={(e) => setNewSupplier({...newSupplier, category: e.target.value})} />
                      </div>
                    </div>
                 </div>

                 <div className="input-group">
                    <label>Business Address</label>
                    <div className="input-wrapper" style={{ alignItems: 'flex-start' }}>
                      <MapPin size={16} className="input-icon" style={{ marginTop: '16px' }} />
                      <textarea 
                        rows={3}
                        placeholder="Physical location..." 
                        style={{ background: 'transparent', border: 'none', width: '100%', color: 'var(--text)', outline: 'none', resize: 'none', padding: '12px 14px 12px 40px', fontSize: '14px', fontWeight: 500 }}
                        value={newSupplier.address} 
                        onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})} 
                      />
                    </div>
                 </div>

                 <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                    <button type="button" onClick={() => setShowSupplierModal(false)} className="btn-secondary" style={{ flex: 1, padding: '16px', borderRadius: '14px', background: 'var(--surface-hover)', color: 'var(--text)', fontWeight: 700, border: '1.5px solid var(--border)' }}>Cancel</button>
                    <button type="submit" className="btn-primary" style={{ flex: 2, padding: '16px', borderRadius: '14px', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)' }} disabled={isProcessing}>
                        {isProcessing ? 'Onboarding Vendor...' : 'Complete Registration'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      <style jsx="true">{`
        .input-group label {
          font-weight: 700;
          font-size: 11px;
          color: var(--text-muted);
          margin-bottom: 8px;
          display: block;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .input-wrapper {
          display: flex;
          align-items: center;
          position: relative;
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: 12px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          box-shadow: var(--shadow-sm);
        }
        .input-wrapper:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
        }
        .input-icon {
          position: absolute;
          left: 13px;
          color: var(--text-muted);
          opacity: 0.65;
          pointer-events: none;
        }
        .input-wrapper input {
          width: 100%;
          background: transparent;
          border: none;
          color: var(--text);
          font-size: 14px;
          outline: none;
          font-weight: 500;
          padding: 12px 14px 12px 40px;
        }
        .input-wrapper input::placeholder {
          color: var(--text-muted);
          opacity: 0.5;
        }
        .tab-btn {
          padding: 12px 24px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          font-size: 14px;
          color: var(--text-muted);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .tab-btn.active {
          background: var(--surface);
          color: var(--accent);
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          border: 1px solid var(--border);
        }
        .btn-primary {
          background: var(--accent);
          color: white;
          border: none;
          border-radius: 14px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s ease;
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
