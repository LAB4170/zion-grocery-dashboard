const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Configure Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL || 'https://zion-grocery-dashboard.onrender.com'] 
      : ['http://localhost:5000', 'http://127.0.0.1:5000', 'http://localhost:8080', 'http://127.0.0.1:8080'],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// PostgreSQL database connection - required
const db = require('./config/database');
// Import routes
const dashboardRoutes = require('./routes/dashboard');
const productRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const expenseRoutes = require('./routes/expenses');
const debtRoutes = require('./routes/debts');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for frontend
  crossOriginEmbedderPolicy: false
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://your-netlify-app.netlify.app'] 
    : ['http://localhost:5000', 'http://127.0.0.1:5000', 'http://localhost:8080', 'http://127.0.0.1:8080'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Serve static files from frontend directory
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath, {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: true,
  lastModified: true
}));

// Optimized static file serving for specific directories
app.use('/scripts', express.static(path.join(frontendPath, 'scripts'), { maxAge: '1h' }));
app.use('/styles', express.static(path.join(frontendPath, 'styles'), { maxAge: '1h' }));
app.use('/modals', express.static(path.join(frontendPath, 'modals'), { maxAge: '1h' }));
app.use('/partials', express.static(path.join(frontendPath, 'partials'), { maxAge: '1h' }));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('📡 Socket.IO client connected:', socket.id);
  
  // Join a room for grocery dashboard updates
  socket.join('grocery-dashboard');
  
  // Handle client disconnection
  socket.on('disconnect', () => {
    console.log('📡 Socket.IO client disconnected:', socket.id);
  });
  
  // Handle manual refresh requests
  socket.on('request-refresh', (data) => {
    socket.to('grocery-dashboard').emit('data-refresh', {
      type: data.type || 'all',
      timestamp: Date.now()
    });
  });
  
  // Send welcome message
  socket.emit('connection-established', {
    message: 'Real-time sync ready with Socket.IO',
    timestamp: Date.now()
  });
});

// Broadcast function for data changes
const broadcastDataChange = (type, data) => {
  io.to('grocery-dashboard').emit('data-update', {
    type: type,
    data: data,
    timestamp: Date.now()
  });
  console.log(`📡 Broadcasting ${type} update to all clients`);
};

// Make broadcast function available to routes
app.locals.broadcastDataChange = broadcastDataChange;
app.locals.io = io;

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: require('./package.json').version,
    database: 'PostgreSQL Connected'
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

// API routes
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Handle frontend routing - serve index.html for non-API routes
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'API endpoint not found',
      path: req.originalUrl
    });
  }
  
  // Serve index.html for all other routes (SPA routing)
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Zion Grocery Dashboard running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`🌐 Frontend: http://localhost:${PORT}`);
    console.log(`📱 Login: http://localhost:${PORT}/login.html`);
  });
}

module.exports = app;
