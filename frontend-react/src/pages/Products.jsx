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

      <style jsx>{`
        .products {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          gap: 20px;
          flex-wrap: wrap;
        }
        .page-header h1 {
          font-size: 32px;
          letter-spacing: -1px;
        }
        .header-actions {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .search-box {
          display: flex;
          align-items: center;
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 8px 16px;
          border-radius: var(--radius-md);
          gap: 12px;
          min-width: 300px;
        }
        .search-box input {
          background: transparent;
          border: none;
          color: var(--text);
          outline: none;
          width: 100%;
          font-weight: 500;
        }
        .btn-primary {
          background-color: var(--accent);
          color: white;
          padding: 10px 20px;
          border-radius: var(--radius-md);
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-primary:hover {
          background-color: var(--accent-hover);
          transform: translateY(-1px);
        }
        .table-card {
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        .pos-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .pos-table th {
          padding: 16px 24px;
          background: rgba(255, 255, 255, 0.02);
          font-size: 13px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid var(--border);
        }
        .pos-table td {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
          font-size: 15px;
          color: var(--text);
          font-weight: 500;
        }
        .product-name {
          font-weight: 700;
        }
        .price {
          color: var(--accent);
          font-weight: 700;
        }
        .stock-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
        }
        .status-dot {
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-right: 8px;
        }
        .status-dot.active { background-color: var(--accent); }
        .status-dot.inactive { background-color: var(--danger); }
        .empty-row {
          padding: 48px !important;
          text-align: center;
          color: var(--text-muted);
          font-style: italic;
        }
        .loading-state {
          padding: 100px;
          text-align: center;
          color: var(--text-muted);
          font-size: 18px;
          font-weight: 600;
        }
        .error-message {
          padding: 24px;
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger);
          border-radius: var(--radius-md);
          text-align: center;
          font-weight: 600;
        }
        @media (max-width: 600px) {
          .search-box { min-width: 100%; }
          .pos-table th:nth-child(2), .pos-table td:nth-child(2) { display: none; }
        }
      `}</style>
    </div>
  );
}
