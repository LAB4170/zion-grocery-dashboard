import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // The Axios interceptor automatically attaches the Firebase JWT Token securely!
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch products from backend');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ color: '#fff', fontSize: '1.2rem', textAlign: 'center', marginTop: '4rem' }}>Loading Inventory...</div>;
  if (error) return <div style={{ color: '#FF3D71', background: 'rgba(255,61,113,0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #FF3D71' }}>{error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, color: '#fff' }}>Products Inventory</h1>
        <button style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #6B48FF 0%, #5134d1 100%)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 10px 20px -10px rgba(107, 72, 255, 0.5)' }}>
          + Add Product
        </button>
      </div>

      <div style={{ background: 'rgba(21, 26, 35, 0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', color: '#8F9BB3', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '1.25rem 1.5rem', fontWeight: 600 }}>Name</th>
              <th style={{ padding: '1.25rem 1.5rem', fontWeight: 600 }}>Category</th>
              <th style={{ padding: '1.25rem 1.5rem', fontWeight: 600 }}>Price</th>
              <th style={{ padding: '1.25rem 1.5rem', fontWeight: 600 }}>Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: '#8F9BB3' }}>No products found in the database.</td></tr>
            ) : (
              products.map(product => (
                <tr key={product.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={{ padding: '1.25rem 1.5rem', color: '#fff', fontWeight: 500 }}>{product.name}</td>
                  <td style={{ padding: '1.25rem 1.5rem', color: '#8F9BB3' }}>{product.category}</td>
                  <td style={{ padding: '1.25rem 1.5rem', color: '#1CE783', fontWeight: 500 }}>${Number(product.price).toFixed(2)}</td>
                  <td style={{ padding: '1.25rem 1.5rem', color: product.stock_quantity < 10 ? '#FFAA00' : '#fff' }}>
                    <span style={{ padding: '0.25rem 0.75rem', background: product.stock_quantity < 10 ? 'rgba(255, 170, 0, 0.1)' : 'rgba(255,255,255,0.05)', color: product.stock_quantity < 10 ? '#FFAA00' : '#fff', borderRadius: '12px' }}>
                      {product.stock_quantity}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
