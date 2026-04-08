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
const { initWorker } = require('./workers/statsWorker');

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
const adminRoutes = require('./routes/admin');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { requireBusinessAuth } = require('./middleware/auth');
const { requireAdminAuth } = require('./middleware/adminAuth');
const { requireFirebaseAdminAuth } = require('./middleware/firebaseAdminAuth');
const { requireTenantContext } = require('./middleware/tenantGuard');

/**
 * Dual Admin Auth — accepts either:
 *  (A) Legacy: x-admin-key header (backward compat during migration)
 *  (B) New:    Authorization: Bearer <firebase-token> with role:'admin' claim
 * 
 * Once all admin users have the Firebase claim set, remove requireAdminAuth.
 */
const dualAdminAuth = async (req, res, next) => {
  // If they're using the new Firebase token method, use Firebase auth
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return requireFirebaseAdminAuth(req, res, next);
  }
  // Otherwise fall back to the static key (legacy)
  return requireAdminAuth(req, res, next);
};


// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for frontend
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" } // CRITICAL for Firebase Google Sign-In popups
}));
app.use(compression());

// Rate limiting (skip dev)
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 500,
  skip: () => process.env.NODE_ENV === 'development',
  message: { success: false, error: 'Too many requests. Please try again later.' }
});

// Stricter limiter for onboarding/registration
const onboardingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, // 10 attempts per 15 mins
  skip: () => process.env.NODE_ENV === 'development',
  message: { success: false, error: 'Too many registration attempts. Please wait 15 minutes.' }
});

// Strict limiter for payments (expensive resources)
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 mins
  skip: () => process.env.NODE_ENV === 'development',
  message: { success: false, error: 'Too many payment attempts. Please wait 15 minutes.' }
});

// General API data limiter to prevent scraping
const apiGeneralLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100, // 100 requests per minute
  skip: () => process.env.NODE_ENV === 'development',
  message: { success: false, error: 'High traffic detected. Please slow down.' }
});

// Admin Dashboard limiter (heavy queries)
const adminDashboardLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30, // 30 requests per minute
  skip: () => process.env.NODE_ENV === 'development',
  message: { success: false, error: 'Too many admin requests. Please wait a minute.' }
});

app.use('/api/', limiter);
app.use('/api/products', apiGeneralLimiter);
app.use('/api/sales', apiGeneralLimiter);
app.use('/api/expenses', apiGeneralLimiter);
app.use('/api/debts', apiGeneralLimiter);

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

// Serve from backend/public — build step copies frontend-react/dist here.
// path.join(__dirname, 'public') is always relative to this file, never ambiguous.
const frontendPath = path.join(__dirname, 'public');

console.log('📡 Serving frontend from:', frontendPath);
console.log('📡 public/ exists:', fs.existsSync(frontendPath));
console.log('📡 index.html exists:', fs.existsSync(path.join(frontendPath, 'index.html')));

// Serve static assets with long cache (hashed filenames, safe to cache)
app.use(express.static(frontendPath, {
  maxAge: '1y',
  etag: true,
  index: false // Disable automatic index.html serving so it falls through to our custom catch-all route with no-cache headers
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
// Diagnostic Endpoint for Deployment Issues
app.get('/api/debug-deploy', (req, res) => {
  const assetDir = path.join(frontendPath, 'assets');
  res.json({
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    cwd: process.cwd(),
    dirname: __dirname,
    frontendPath,
    frontendExists: fs.existsSync(frontendPath),
    indexExists: fs.existsSync(path.join(frontendPath, 'index.html')),
    assetsExist: fs.existsSync(assetDir),
    assetFiles: fs.existsSync(assetDir) ? fs.readdirSync(assetDir).slice(0, 10) : [],
    backendFiles: fs.readdirSync(__dirname).slice(0, 20)
  });
});

// API routes
app.use('/api/business', onboardingLimiter, requireBusinessAuth, businessRoutes);
app.use('/api/products', requireBusinessAuth, requireTenantContext, productRoutes);
app.use('/api/sales', requireBusinessAuth, requireTenantContext, salesRoutes);
app.use('/api/expenses', requireBusinessAuth, requireTenantContext, expenseRoutes);
app.use('/api/debts', requireBusinessAuth, requireTenantContext, debtRoutes);
app.use('/api/dashboard', apiGeneralLimiter, requireBusinessAuth, requireTenantContext, dashboardRoutes);
app.use('/api/payments', paymentLimiter, requireBusinessAuth, requireTenantContext, paymentsRoutes);
app.use('/api/admin', adminDashboardLimiter, dualAdminAuth, adminRoutes);

// Handle React frontend routing - Catch all to serve index.html
// Important: send index.html with no-cache so browsers always get the latest asset references
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ success: false, message: 'API not found' });

  const indexPath = path.join(frontendPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.sendFile(indexPath);
  } else {
    res.status(500).json({ 
      success: false, 
      message: 'Frontend build not found.',
      frontendPath,
      frontendExists: fs.existsSync(frontendPath),
      indexPath,
      cwd: process.cwd(),
      dirname: __dirname
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
  // Initialize background workers
  initWorker();
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
