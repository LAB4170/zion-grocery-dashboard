const knex = require("knex");
require("dotenv").config();

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
    connection: process.env.DATABASE_URL,
    pool: {
      min: 5,
      max: 20
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

// Simple connection test
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

// Test connection on startup
testConnection();

module.exports = db;
