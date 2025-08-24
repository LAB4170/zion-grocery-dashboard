const knex = require('knex');
require('dotenv').config();

// PostgreSQL-only configuration for all environments
const config = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'zion_grocery_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'ZionGrocery2024!'
    },
    pool: {
      min: 5,
      max: 50,
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: '../migrations'
    },
    seeds: {
      directory: '../seeds'
    }
  },
  
  test: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME_TEST || 'zion_grocery_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'ZionGrocery2024!'
    },
    pool: {
      min: 1,
      max: 5
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: '../migrations'
    },
    seeds: {
      directory: '../seeds'
    }
  },
  
  production: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    },
    pool: {
      min: 10,
      max: 100,
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: '../migrations'
    },
    seeds: {
      directory: '../seeds'
    }
  }
};

const environment = process.env.NODE_ENV || 'development';

// PostgreSQL-only configuration - no fallbacks
const db = knex(config[environment]);

// Test PostgreSQL connection on startup
db.raw('SELECT 1')
  .then(() => {
    console.log(`✅ PostgreSQL connected successfully (${environment})`);
  })
  .catch((err) => {
    console.error(`❌ PostgreSQL connection failed (${environment}):`, err.message);
    console.error('Please ensure PostgreSQL is running and configured correctly');
    process.exit(1); // Exit if PostgreSQL is not available
  });

module.exports = db;
