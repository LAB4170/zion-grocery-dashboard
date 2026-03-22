const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();

// Utility: normalize origin by removing trailing slash and lowercasing
function normalizeOrigin(value) {
  if (!value) return value;
  try {
    // If it's a full URL, use URL parsing, else trim only
    const u = new URL(value);
    const normalized = `${u.protocol}//${u.host}`.toLowerCase();
    return normalized;
  } catch {
    return value.replace(/\/$/, '').toLowerCase();
  }
}

// Build allowed origins list from env
function getAllowedOrigins() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment) {
    return [
      'http://localhost:5000', 
      'http://127.0.0.1:5000', 
      'http://localhost:5173', 
      'http://127.0.0.1:5173',
      'http://localhost:8080'
    ].map(normalizeOrigin);
  }
  // Production: support single FRONTEND_URL or comma-separated FRONTEND_URLS
  const single = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [];
  const multi = process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',').map(s => s.trim()).filter(Boolean) : [];
  const all = [...single, ...multi].map(normalizeOrigin);
  return all;
}

function isAllowedOrigin(origin) {
  if (!origin) return true; // allow curl/mobile apps
  const allowed = getAllowedOrigins();
  if (allowed.length === 0) {
    // No FRONTEND_URL configured: allow origin (lenient fallback to avoid hardcoding providers)
    return true;
  }
  const normalizedOrigin = normalizeOrigin(origin);
  return allowed.includes(normalizedOrigin);
}

// CRITICAL: Trust proxy for deployment
app.set('trust proxy', true);

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Configure Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// PostgreSQL database connection - required
const { db, testConnection } = require('./config/database');
// Import routes
const { router: dashboardRoutes, clearDashboardCache } = require('./routes/dashboard');
const productRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const expenseRoutes = require('./routes/expenses');
const debtRoutes = require('./routes/debts');
const businessRoutes = require('./routes/businesses');
const paymentsRoutes = require('./routes/payments');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { requireBusinessAuth } = require('./middleware/auth');
// const { requireActiveSubscription } = require('./middleware/subscription');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for frontend
  crossOriginEmbedderPolicy: false
}));
app.use(compression());

// Rate limiting — skipped in development to avoid 429 feedback loops
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 500,
  skip: () => process.env.NODE_ENV === 'development',
  message: { success: false, error: 'Too many requests. Please try again later.' }
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (isAllowedOrigin(origin)) return callback(null, true);

    return callback(new Error('Not allowed by CORS'));
  },
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

// Robust path resolution for static files
const possibleFrontendPaths = [
  path.join(__dirname, 'dist'),                     // Standard Bulletproof (backend/dist)
  path.join(process.cwd(), 'dist'),                 // If running from within backend/
  path.join(process.cwd(), 'backend/dist'),         // If running from root
  path.join(__dirname, '../frontend-react/dist'),   // Original structure fallback
  path.join(process.cwd(), 'frontend-react/dist')   // Root-relative original structure
];

const frontendPath = possibleFrontendPaths.find(p => fs.existsSync(p)) || possibleFrontendPaths[0];

console.log('📡 Static Assets Search:');
possibleFrontendPaths.forEach(p => console.log(`  - ${p} [${fs.existsSync(p) ? '✅ FOUND' : '❌ NOT FOUND'}]`));
console.log('🚀 Final Static Path:', frontendPath);

app.use(express.static(frontendPath, {
  maxAge: '1d',
  etag: true,
}));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('📡 Socket.IO client connected:', socket.id);
  socket.join('grocery-dashboard');
  socket.on('disconnect', () => {
    console.log('📡 Socket.IO client disconnected:', socket.id);
  });
});

// Broadcast function for data changes (Stub if needed)
const broadcastDataChange = (type, data) => {
  io.to('grocery-dashboard').emit('data-update', { type, data, timestamp: Date.now() });
};
app.locals.broadcastDataChange = broadcastDataChange;

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await db.raw('SELECT 1');
    res.json({ status: 'OK', database: 'Connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'ERROR', database: 'Disconnected' });
  }
});

// API routes
app.use('/api/business', requireBusinessAuth, businessRoutes);
app.use('/api/products', requireBusinessAuth, productRoutes);
app.use('/api/sales', requireBusinessAuth, salesRoutes);
app.use('/api/expenses', requireBusinessAuth, expenseRoutes);
app.use('/api/debts', requireBusinessAuth, debtRoutes);
app.use('/api/dashboard', requireBusinessAuth, dashboardRoutes);
app.use('/api/payments', requireBusinessAuth, paymentsRoutes);

// Handle React frontend routing - Catch all to serve index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ success: false, message: 'API not found' });
  
  const indexPath = path.join(frontendPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Return a more descriptive error instead of crashing/blank 500
    res.status(500).json({ 
      success: false, 
      message: 'Frontend build not found. Please ensure "npm run build" was successful.',
      debug: {
        env: process.env.NODE_ENV,
        cwd: process.cwd(),
        dirname: __dirname,
        selectedPath: frontendPath,
        triedPaths: possibleFrontendPaths,
        indexPathExists: fs.existsSync(indexPath),
        indexPath: indexPath
      }
    });
  }
});

// Initialize Backup System
const BackupSystem = require('./backup-system');
const backupSystem = new BackupSystem();
backupSystem.schedule();

// Global error handler - KDP Compliant (No sensitive details in production)
app.use((err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';
  console.error('Unhandled Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: isProduction ? 'Internal server error. Reference ID: ' + req.id : err.message,
    code: err.code || 'INTERNAL_ERROR'
  });
});

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
  const isDevelopment = process.env.NODE_ENV === 'development';
  const environment = process.env.NODE_ENV || 'development';
  const frontendUrl = process.env.FRONTEND_URL || `http://localhost:${PORT}`;
    
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Nexus POS (Integrated Server) running on port ${PORT}`);
    console.log(`📊 Environment: ${environment}`);
    console.log(`🗄️  Database: ${isDevelopment ? 'Local PostgreSQL' : 'Production PostgreSQL'}`);
    console.log(`🏥 Health check: ${frontendUrl}/health`);
    console.log(`🌐 Frontend: ${frontendUrl}`);
    console.log(`📱 Login: ${frontendUrl}/login`);
    console.log(`🔧 API Base: ${frontendUrl}/api`);
    console.log(`📡 Socket.IO: ${isDevelopment ? 'Development Mode' : 'Production Mode'}`);
    console.log(`========================================`);
  });
}

module.exports = app;
