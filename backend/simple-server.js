const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple in-memory storage for testing
let products = [
  { id: '1', name: 'White Bread', category: 'Bakery', price: 50, stock: 25 },
  { id: '2', name: 'Milk 1L', category: 'Dairy', price: 120, stock: 30 },
  { id: '3', name: 'Rice 2kg', category: 'Grains', price: 180, stock: 20 }
];

let sales = [];
let expenses = [];
let debts = [];

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Zion Grocery API is running'
  });
});

// Products routes
app.get('/api/products', (req, res) => {
  res.json({ success: true, data: products });
});

app.post('/api/products', (req, res) => {
  const product = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  products.push(product);
  res.json({ success: true, data: product });
});

// Sales routes
app.get('/api/sales', (req, res) => {
  res.json({ success: true, data: sales });
});

app.post('/api/sales', (req, res) => {
  const sale = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  sales.push(sale);
  
  // Update product stock
  const product = products.find(p => p.id === sale.product_id);
  if (product) {
    product.stock -= sale.quantity;
  }
  
  res.json({ success: true, data: sale });
});

// Dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
  const totalSales = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const totalDebts = debts.reduce((sum, debt) => sum + (debt.balance || 0), 0);
  
  res.json({
    success: true,
    data: {
      sales: { total_revenue: totalSales, total_sales: sales.length },
      expenses: { total_expenses: totalExpenses },
      debts: { total_outstanding: totalDebts },
      inventory: { low_stock_count: products.filter(p => p.stock < 10).length }
    }
  });
});

// Simple auth (for testing)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.json({
      success: true,
      data: {
        user: { id: '1', username: 'admin', role: 'admin' },
        token: 'simple-test-token'
      }
    });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Catch all
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Zion Grocery Simple API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 This is a simplified version for testing`);
});

module.exports = app;
