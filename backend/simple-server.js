const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
  credentials: true
}));
app.use(express.json());

// PostgreSQL database connection - required
const db = require('./config/database');
console.log('✅ PostgreSQL database module loaded successfully');

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Zion Grocery API Server is running',
    timestamp: new Date().toISOString(),
    database: db ? 'Connected' : 'Not Connected'
  });
});

// Test PostgreSQL database route
app.get('/api/test-db', async (req, res) => {
  try {
    await db.raw('SELECT version() as version');
    const result = await db.raw('SELECT current_database() as database');
    res.json({ 
      message: 'PostgreSQL connection successful',
      database: result.rows[0].database 
    });
  } catch (error) {
    res.status(500).json({ error: 'PostgreSQL connection failed', details: error.message });
  }
});

// Import and use all API routes
try {
  const productRoutes = require('./routes/products');
  const salesRoutes = require('./routes/sales');
  const expenseRoutes = require('./routes/expenses');
  const debtRoutes = require('./routes/debts');
  const dashboardRoutes = require('./routes/dashboard');

  app.use('/api/products', productRoutes);
  app.use('/api/sales', salesRoutes);
  app.use('/api/expenses', expenseRoutes);
  app.use('/api/debts', debtRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  
  console.log('✅ All PostgreSQL API routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading routes:', error.message);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Zion Grocery API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Database test: http://localhost:${PORT}/api/test-db`);
});
