import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Plus, Minus, Trash2, CreditCard, Wallet, User, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

export default function Sales() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const socket = useSocket();

  useEffect(() => {
    fetchProducts();
    if (socket) {
      socket.on('data-update', (data) => {
        if (data.type === 'product') fetchProducts();
      });
    }
    return () => socket?.off('data-update');
  }, [socket]);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data.data.filter(p => p.stockQuantity > 0) || []);
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stockQuantity) {
        alert('Cannot add more than available stock');
        return;
      }
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const setQuantity = (id, newQty) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const val = parseFloat(newQty);
        if (isNaN(val)) return item;
        const product = products.find(p => p.id === id);
        if (val > product.stockQuantity) return item;
        return val > 0 ? { ...item, quantity: val } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'debt' && (!customer.name || !customer.phone)) {
      setError('Customer name and phone are required for debt sales.');
      return;
    }

    setIsProcessing(true);
    setError('');
    try {
      // Create a sale for each item (Matching backend model which expects one record per product)
      // Note: A more advanced POS would have a "Transaction" model, but here Sale = Record.
      const promises = cart.map(item => api.post('/sales', {
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        total: item.price * item.quantity,
        paymentMethod: paymentMethod,
        customerName: customer.name || null,
        customerPhone: customer.phone || null,
        status: 'completed'
      }));

      await Promise.all(promises);
      
      setSuccessMessage('Transaction completed successfully! Stock updated.');
      setCart([]);
      setCustomer({ name: '', phone: '' });
      fetchProducts();
      
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Transaction failed. Please check stock levels.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="sales-terminal" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px', height: 'calc(100vh - 120px)' }}>
      {/* Left Column: Product Selection */}
      <section className="card-elevated" style={{ display: 'flex', flexDirection: 'column', padding: '24px' }}>
        <header style={{ marginBottom: '24px' }}>
          <h1>POS Terminal</h1>
          <div className="search-box card-elevated" style={{ marginTop: '16px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
             <Search size={18} style={{ color: 'var(--text-muted)' }} />
             <input 
               type="text" 
               placeholder="Search product by name or category..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
        </header>

        <div className="products-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
          gap: '16px', 
          overflowY: 'auto',
          paddingRight: '8px'
        }}>
          {filteredProducts.map(p => (
            <div key={p.id} className="glass product-selection-card" style={{ padding: '16px', borderRadius: '16px', cursor: 'pointer', transition: 'var(--transition)' }} onClick={() => addToCart(p)}>
              <div style={{ width: 40, height: 40, background: 'var(--bg)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', color: 'var(--accent)' }}>
                <Plus size={20} />
              </div>
              <h4 style={{ fontSize: '15px', marginBottom: '4px' }}>{p.name}</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>{p.category}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <span style={{ fontWeight: 800, fontSize: '16px' }}>KSh {p.price}</span>
                <span style={{ fontSize: '11px', color: p.stockQuantity < 5 ? 'var(--danger)' : 'var(--text-muted)' }}>{p.stockQuantity} {p.unit || 'pcs'}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Right Column: Cart & Payment */}
      <section className="card-elevated" style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface)', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <ShoppingCart size={20} />
          <h2 style={{ fontSize: '20px' }}>Current Cart</h2>
        </div>

        <div className="cart-items" style={{ flex: 1, overflowY: 'auto', marginBottom: '24px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
               <ShoppingCart size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
               <p>Your cart is empty.</p>
            </div>
          ) : cart.map(item => (
            <div key={item.id} className="cart-item glass" style={{ padding: '12px', borderRadius: '12px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px' }}>{item.name}</span>
                <button onClick={() => removeFromCart(item.id)} style={{ color: 'var(--danger)', opacity: 0.6 }}><Trash2 size={14} /></button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg)', padding: '4px 8px', borderRadius: '8px' }}>
                    <button onClick={() => setQuantity(item.id, item.quantity - 1)}><Minus size={14} /></button>
                    <input 
                      type="number" 
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => setQuantity(item.id, e.target.value)}
                      style={{ width: '40px', textAlign: 'center', background: 'transparent', border: 'none', fontWeight: 800, color: 'var(--text)', outline: 'none', fontSize: '14px' }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>{item.unit || 'pcs'}</span>
                    <button onClick={() => setQuantity(item.id, item.quantity + 1)}><Plus size={14} /></button>
                 </div>
                 <span style={{ fontWeight: 800 }}>KSh {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="transaction-controls" style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
            <div className="payment-modes" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
               <button onClick={() => setPaymentMethod('cash')} className={paymentMethod === 'cash' ? 'btn-payment active' : 'btn-payment'}>
                 <Wallet size={16} /> Cash
               </button>
               <button onClick={() => setPaymentMethod('mpesa')} className={paymentMethod === 'mpesa' ? 'btn-payment active' : 'btn-payment'}>
                 <CreditCard size={16} /> M-Pesa
               </button>
               <button onClick={() => setPaymentMethod('debt')} className={paymentMethod === 'debt' ? 'btn-payment active' : 'btn-payment'}>
                 <User size={16} /> Debt
               </button>
            </div>

            {paymentMethod === 'debt' && (
              <div className="debt-form" style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
                 <div className="input-group">
                   <label style={{ fontSize: '12px' }}><User size={12} /> Customer Name</label>
                   <input 
                     type="text" 
                     placeholder="Customer's full name" 
                     value={customer.name}
                     onChange={(e) => setCustomer({...customer, name: e.target.value})}
                   />
                 </div>
                 <div className="input-group">
                   <label style={{ fontSize: '12px' }}><Phone size={12} /> Phone Number</label>
                   <input 
                     type="text" 
                     placeholder="M-Pesa number" 
                     value={customer.phone}
                     onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                   />
                 </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Total Payable:</span>
              <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent)' }}>KSh {total.toLocaleString()}</span>
            </div>

            {error && <div className="glass" style={{ padding: '12px', borderRadius: '12px', color: 'var(--danger)', fontSize: '13px', marginBottom: '16px', display: 'flex', gap: '8px' }}><AlertCircle size={16} /> {error}</div>}
            {successMessage && <div className="glass" style={{ padding: '12px', borderRadius: '12px', color: 'var(--accent)', fontSize: '13px', marginBottom: '16px', display: 'flex', gap: '8px' }}><CheckCircle size={16} /> {successMessage}</div>}

            <button 
              className="btn-primary" 
              style={{ width: '100%', padding: '18px', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
              disabled={isProcessing || cart.length === 0}
              onClick={handleCheckout}
            >
              {isProcessing ? 'Processing...' : (
                <>Complete {paymentMethod.toUpperCase()} Sale</>
              )}
            </button>
          </div>
        )}
      </section>

      <style jsx="true">{`
        .btn-payment {
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--text-muted);
          padding: 12px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          transition: all 0.2s ease;
        }
        .btn-payment:hover {
          background: var(--surface-hover);
        }
        .btn-payment.active {
          background: var(--accent);
          color: white;
          border-color: var(--accent);
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
        }
        .product-selection-card:hover {
          background: var(--surface-hover);
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }
      `}</style>
    </div>
  );
}
