// Update with your config settings.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Environment detection
const environment = process.env.NODE_ENV || 'development';
const isDevelopment = environment === 'development';

// Database URL selection based on environment
const getDatabaseUrl = () => {
  if (isDevelopment) {
    return process.env.LOCAL_DATABASE_URL || {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'zion_grocery_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      ssl: false
    };
  } else {
    return process.env.DATABASE_URL;
  }
};

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

  development: {
    client: 'postgresql',
    connection: getDatabaseUrl(),
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    }
  },

  test: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_TEST_NAME || 'zion_grocery_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD
    },
    pool: {
      min: 1,
      max: 5
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    }
  },

  production: {
    client: 'postgresql',
    connection: (() => {
      const url = process.env.DATABASE_URL;
      if (!url) return null;
      // Optional SSL toggle via env (DB_SSL=true enables SSL with relaxed cert)
      const useSSL = (process.env.DB_SSL || '').toLowerCase() === 'true';
      return useSSL
        ? { connectionString: url, ssl: { rejectUnauthorized: false } }
        : { connectionString: url };
    })(),
    pool: {
      min: 5,
      max: 20,
      createTimeoutMillis: 30000,
      acquireTimeoutMillis: 60000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    }
  }

};
