const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
  // Connect to postgres database first
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'ZionGrocery2024!',
    database: 'postgres' // Connect to default postgres database
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL server');

    // Check if database exists
    const checkDb = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      ['zion_grocery_db']
    );

    if (checkDb.rows.length === 0) {
      // Create database
      await client.query('CREATE DATABASE zion_grocery_db');
      console.log('✅ Database "zion_grocery_db" created successfully');
    } else {
      console.log('✅ Database "zion_grocery_db" already exists');
    }

    await client.end();
    
    // Now test connection to the new database
    const testClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'ZionGrocery2024!',
      database: 'zion_grocery_db'
    });

    await testClient.connect();
    console.log('✅ Successfully connected to zion_grocery_db');
    
    const result = await testClient.query('SELECT NOW()');
    console.log('📊 Database timestamp:', result.rows[0].now);
    
    await testClient.end();
    console.log('🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure PostgreSQL is running on port 5432');
    }
    process.exit(1);
  }
}

createDatabase();
