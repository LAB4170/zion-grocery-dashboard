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

// PostgreSQL configuration for Zion Grocery Management System
const config = {
  development: {
    client: "postgresql",
    connection: {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || "zion_grocery_db",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "ZionGrocery2024!",
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: 5,
      max: 50,
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
    connection: {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME_TEST || "zion_grocery_db_test",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "ZionGrocery2024!",
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: 2,
      max: 10,
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
    connection: process.env.DATABASE_URL || {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false }
    },
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

const environment = process.env.NODE_ENV || "development";

// PostgreSQL-only configuration - no fallbacks
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

// Test PostgreSQL connection on startup
db.raw("SELECT 1")
  .then(() => {
    console.log(`✅ PostgreSQL connected successfully (${environment})`);
    console.log(`📊 Server: ${process.env.SERVER_NAME || 'Zion Grocery Server'}`);
    console.log(`🗄️  Database: ${process.env.DB_NAME || 'zion_grocery_db'}`);
    console.log(`🔍 Monitoring: ${dbMonitoring.enabled ? 'Enabled' : 'Disabled'}`);
  })
  .catch((err) => {
    console.error(
      `❌ PostgreSQL connection failed (${environment}):`,
      err.message
    );
    console.error(
      "Please ensure PostgreSQL is running and configured correctly"
    );
    process.exit(1); // Exit if PostgreSQL is not available
  });

// Export database instance and monitoring stats
module.exports = db;
module.exports.monitoring = dbMonitoring;
