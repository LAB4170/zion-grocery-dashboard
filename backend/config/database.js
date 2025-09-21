const knex = require("knex");
require("dotenv").config();

// Environment variable validation - only for development
function validateEnvironmentVariables() {
  // Only validate DB_PASSWORD for development environment
  if (process.env.NODE_ENV === 'development') {
    const requiredVars = ['DB_PASSWORD'];
    const missing = requiredVars.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Validate DB_PORT is a valid number
    const port = process.env.DB_PORT;
    if (port && (isNaN(parseInt(port)) || parseInt(port) <= 0)) {
      throw new Error(`Invalid DB_PORT: ${port}. Must be a positive number.`);
    }
  }
}

// Validate environment variables at startup
validateEnvironmentVariables();

// Environment-based PostgreSQL configuration
const config = {
  development: {
    client: "postgresql",
    connection: {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || "zion_grocery_db"
    },
    pool: {
      min: 2,
      max: 10
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
    connection: (() => {
      const url = process.env.DATABASE_URL;
      if (!url) return null;
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
      tableName: "knex_migrations",
      directory: "./migrations",
    },
    seeds: {
      directory: "./seeds",
    },
  },
};

// Create database instance
const environment = process.env.NODE_ENV || "development";
const db = knex(config[environment]);

// Async connection test - DO NOT run at module load
async function testConnection() {
  try {
    await db.raw("SELECT 1");
    console.log(`✅ Database connected (${environment})`);
    return true;
  } catch (err) {
    console.error(`❌ Database connection failed:`, err.message);
    return false;
  }
}

// Export both database instance and test function
module.exports = {
  db,
  testConnection
};
