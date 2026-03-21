import { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
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
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch inventory from backend');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-state">Loading Inventory...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="products">
      <header className="page-header">
        <h1>Inventory Management</h1>
        <div className="header-actions">
          <div className="search-box">
             <Search size={18} />
             <input type="text" placeholder="Search products..." />
          </div>
          <button className="btn-primary">
            <Plus size={20} /> Add Product
          </button>
        </div>
      </header>

      <div className="table-card glass">
        <table className="pos-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock Level</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan="5" className="empty-row">No active products found.</td></tr>
            ) : (
              products.map(product => (
                <tr key={product.id}>
                  <td className="product-name">{product.name}</td>
                  <td>{product.category}</td>
                  <td className="price">KSh {Number(product.price).toLocaleString()}</td>
                  <td>
                    <div className="stock-badge" style={{ 
                      backgroundColor: product.stock_quantity < 10 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: product.stock_quantity < 10 ? 'var(--danger)' : 'var(--accent)'
                    }}>
                      {product.stock_quantity} in stock
                    </div>
                  </td>
                  <td>
                    <span className={`status-dot ${product.stock_quantity > 0 ? 'active' : 'inactive'}`}></span>
                    {product.stock_quantity > 0 ? 'Available' : 'Out of Stock'}
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
