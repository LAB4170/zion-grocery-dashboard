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
    return ['http://localhost:5000', 'http://127.0.0.1:5000', 'http://localhost:8080'].map(normalizeOrigin);
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

// Health check endpoint with comprehensive database status
app.get('/health', async (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: require('./package.json').version,
    database: {
      status: 'Unknown',
      type: 'PostgreSQL',
      environment: process.env.NODE_ENV === 'development' ? 'Local' : 'Production',
      lastChecked: new Date().toISOString()
    },
    api: {
      baseUrl: (() => {
        const base = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
        return `${base}/api`;
      })(),
      endpoints: ['/products', '/sales', '/expenses', '/debts', '/dashboard']
    }
  };

  try {
    // Test basic database connection
    const connectionTest = await db.raw('SELECT 1 as test');
    
    // Test database version and info
    const dbVersion = await db.raw('SELECT version() as version');
    const dbName = await db.raw('SELECT current_database() as database');
    
    // Test active connections (may fail on some PostgreSQL configurations)
    let activeConnections = 0;
    try {
      const dbConnections = await db.raw('SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = \'active\'');
      activeConnections = parseInt(dbConnections.rows[0].active_connections);
    } catch (connError) {
      console.warn('Could not get connection count:', connError.message);
    }
    
    // Test table existence
    const tables = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    healthCheck.database = {
      status: 'Connected',
      type: 'PostgreSQL',
      environment: process.env.NODE_ENV === 'development' ? 'Local' : 'Production',
      name: dbName.rows[0].database,
      version: dbVersion.rows[0].version.split(' ')[1], // Extract version number
      activeConnections: activeConnections,
      tables: tables.rows.map(row => row.table_name),
      tableCount: tables.rows.length,
      lastChecked: new Date().toISOString()
    };
    
    console.log(`✅ Health check passed - Database: ${healthCheck.database.name} (${healthCheck.database.environment})`);
    res.status(200).json(healthCheck);
    
  } catch (error) {
    console.error('❌ Health check database error:', error.message);
    
    healthCheck.status = 'ERROR';
    healthCheck.database = {
      status: 'Disconnected',
      type: 'PostgreSQL',
      environment: process.env.NODE_ENV === 'development' ? 'Local' : 'Production',
      error: error.message,
      errorCode: error.code,
      lastChecked: new Date().toISOString(),
      troubleshooting: process.env.NODE_ENV === 'development' ? [
        'Check if PostgreSQL service is running',
        `Verify database "${process.env.DB_NAME || 'zion_grocery_db'}" exists`,
        'Validate DB_HOST, DB_USER, DB_PASSWORD in .env',
        `Run: createdb ${process.env.DB_NAME || 'zion_grocery_db'}`,
        'Run: npm run migrate'
      ] : [
        'Verify DATABASE_URL environment variable',
        'Ensure your cloud database allows connections from this app',
        'If using managed PostgreSQL, ensure SSL parameters are correct',
        'Check your hosting provider logs for database connectivity issues'
      ]
    };
    
    res.status(503).json(healthCheck);
  }
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

// Handle frontend routing - serve login.html by default, index.html for authenticated routes
app.get('/', (req, res) => {
  // Serve login.html for root path by default
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/dashboard', (req, res) => {
  // Serve dashboard for /dashboard route
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/login', (req, res) => {
  // Serve login page for /login route
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'API endpoint not found',
      path: req.originalUrl
    });
  }
  
  // For all other routes, serve login.html to avoid authentication conflicts
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
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
  const isDevelopment = process.env.NODE_ENV === 'development';
  const environment = process.env.NODE_ENV || 'development';
  const frontendUrl = process.env.FRONTEND_URL || `http://localhost:${PORT}`;
    
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Zion Grocery Dashboard (Integrated Server) running on port ${PORT}`);
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
