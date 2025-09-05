const knex = require("knex");
require("dotenv").config();

// Database performance monitoring
const dbMonitoring = {
  enabled: process.env.DB_MONITORING_ENABLED === 'true',
  slowQueryThreshold: parseInt(process.env.DB_SLOW_QUERY_THRESHOLD) || 1000,
  queryCount: 0,
  slowQueries: [],
  connectionStats: {
    total: 0,
    active: 0,
    idle: 0,
    errors: 0
  }
};

// Environment detection
const environment = process.env.NODE_ENV || "development";
const isDevelopment = environment === 'development';
const isProduction = environment === 'production';

// Database URL selection based on environment
const getDatabaseUrl = () => {
  if (isDevelopment) {
    return process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:ZionGrocery2024!@localhost:5432/zion_grocery_db';
  } else {
    return process.env.DATABASE_URL;
  }
};

// PostgreSQL configuration for Zion Grocery Management System - Dual Environment
const config = {
  development: {
    client: "postgresql",
    connection: getDatabaseUrl(),
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 60000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100,
      // Performance monitoring hooks
      afterCreate: function (conn, done) {
        if (dbMonitoring.enabled) {
          dbMonitoring.connectionStats.total++;
          console.log(`📊 DB Connection created. Total: ${dbMonitoring.connectionStats.total}`);
        }
        done(null, conn);
      }
    },
    migrations: {
      tableName: "knex_migrations",
      directory: "./migrations",
    },
    seeds: {
      directory: "./seeds",
    },
  },

  test: {
    client: "postgresql",
    connection: getDatabaseUrl(),
    pool: {
      min: 1,
      max: 5,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: "./migrations",
    },
    seeds: {
      directory: "./seeds",
    },
  },

  production: {
    client: "postgresql",
    connection: process.env.DATABASE_URL,
    pool: {
      min: 10,
      max: 100,
      acquireTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 60000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100,
      // Performance monitoring hooks
      afterCreate: function (conn, done) {
        if (dbMonitoring.enabled) {
          dbMonitoring.connectionStats.total++;
          console.log(`📊 DB Connection created. Total: ${dbMonitoring.connectionStats.total}`);
        }
        done(null, conn);
      }
    },
    migrations: {
      tableName: "knex_migrations",
      directory: "./migrations",
    },
    seeds: {
      directory: "./seeds",
    },
  },
};

// Create database instance with environment-specific configuration
const db = knex(config[environment]);

// Add performance monitoring to database queries
if (dbMonitoring.enabled) {
  db.on('query', (queryData) => {
    dbMonitoring.queryCount++;
    queryData.startTime = Date.now();
  });

  db.on('query-response', (response, queryData) => {
    const duration = Date.now() - queryData.startTime;
    
    if (duration > dbMonitoring.slowQueryThreshold) {
      const slowQuery = {
        sql: queryData.sql,
        bindings: queryData.bindings,
        duration: duration,
        timestamp: new Date().toISOString()
      };
      
      dbMonitoring.slowQueries.push(slowQuery);
      
      // Keep only last 100 slow queries
      if (dbMonitoring.slowQueries.length > 100) {
        dbMonitoring.slowQueries.shift();
      }
      
      console.warn(`🐌 Slow query detected (${duration}ms):`, queryData.sql.substring(0, 100) + '...');
    }
  });

  db.on('query-error', (error, queryData) => {
    dbMonitoring.connectionStats.errors++;
    console.error('❌ Database query error:', error.message);
  });
}

// Test PostgreSQL connection on startup with better error handling
const connectionStatus = {
  connected: false,
  error: null,
  lastChecked: null,
  environment: environment,
  databaseUrl: isDevelopment ? 'Local PostgreSQL' : 'Render PostgreSQL'
};

async function testConnection() {
  try {
    await db.raw("SELECT 1");
    connectionStatus.connected = true;
    connectionStatus.error = null;
    connectionStatus.lastChecked = new Date();
    
    console.log(`✅ PostgreSQL connected successfully (${environment})`);
    console.log(`📊 Server: ${process.env.SERVER_NAME || 'Zion Grocery Server'}`);
    console.log(`🗄️  Database: ${isDevelopment ? 'Local PostgreSQL' : 'Render PostgreSQL'}`);
    console.log(`🔍 Monitoring: ${dbMonitoring.enabled ? 'Enabled' : 'Disabled'}`);
    return true;
  } catch (err) {
    connectionStatus.connected = false;
    connectionStatus.error = err.message;
    connectionStatus.lastChecked = new Date();
    
    console.error(`❌ PostgreSQL connection failed (${environment}):`, err.message);
    
    if (isDevelopment) {
      console.error("💡 Local development tips:");
      console.error("   1. Ensure PostgreSQL is installed and running");
      console.error("   2. Create database: createdb zion_grocery_db");
      console.error("   3. Check credentials in .env file");
      console.error("   4. Run: npm run migrate to setup tables");
    } else {
      console.error("💡 Production tips:");
      console.error("   1. Check Render database status");
      console.error("   2. Verify DATABASE_URL environment variable");
      console.error("   3. Ensure SSL connection is properly configured");
    }
    
    // Don't exit in production, allow graceful degradation
    if (environment === 'production') {
      console.warn("⚠️  Continuing with limited functionality...");
      return false;
    } else {
      console.warn("⚠️  Local development requires database connection");
      return false;
    }
  }
}

// Test connection on startup
testConnection();

// Export database instance, monitoring stats, and connection status
module.exports = db;
module.exports.monitoring = dbMonitoring;
module.exports.connectionStatus = connectionStatus;
module.exports.testConnection = testConnection;
