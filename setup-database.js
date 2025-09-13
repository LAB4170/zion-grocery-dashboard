const { Client } = require('pg');
require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');

console.log('🔄 Setting up Zion Grocery Database...');

// Database configuration from environment variables
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  // Don't specify database initially to connect to default postgres db
};

async function setupDatabase() {
  console.log('🔄 Setting up Zion Grocery Database...');
  
  // Step 1: Connect to PostgreSQL and create database
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL server');
    
    // Check if database exists
    const dbName = process.env.DB_NAME || 'zion_grocery_db';
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );
    
    if (result.rows.length === 0) {
      // Create database
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Created database: ${dbName}`);
    } else {
      console.log(`✅ Database ${dbName} already exists`);
    }
    
    await client.end();
    
    // Step 2: Run migrations
    console.log('🔄 Running database migrations...');
    
    return new Promise((resolve, reject) => {
      const migrationProcess = spawn('npx', ['knex', 'migrate:latest'], {
        cwd: path.join(__dirname, 'backend'),
        stdio: 'inherit',
        shell: true
      });
      
      migrationProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Database migrations completed successfully');
          console.log('🎉 Database setup complete! You can now start the server.');
          resolve();
        } else {
          console.error('❌ Migration failed with code:', code);
          reject(new Error(`Migration failed with code ${code}`));
        }
      });
      
      migrationProcess.on('error', (error) => {
        console.error('❌ Failed to run migrations:', error.message);
        reject(error);
      });
    });
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 PostgreSQL service is not running. Please start PostgreSQL first.');
      console.error('💡 On Windows: Start "PostgreSQL" service in Services');
    } else if (error.message.includes('password authentication failed')) {
      console.error('💡 Check PostgreSQL password in .env file: DB_PASSWORD');
    }
    
    process.exit(1);
  }
}

// Run setup
setupDatabase().catch(console.error);
