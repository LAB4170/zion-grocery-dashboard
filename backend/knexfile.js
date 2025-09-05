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
      host: 'localhost',
      port: 5432,
      database: 'zion_grocery_db',
      user: 'postgres',
      password: 'ZionGrocery2024!',
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
      host: 'localhost',
      port: 5432,
      database: 'zion_grocery_test',
      user: 'postgres',
      password: 'ZionGrocery2024!'
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
    connection: process.env.DATABASE_URL,
    pool: {
      min: 10,
      max: 100
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
