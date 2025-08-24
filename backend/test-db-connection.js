const db = require('./config/database');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await db.raw('SELECT 1+1 as result');
    console.log('✅ Database connection successful!');
    
    // Check if database exists
    const result = await db.raw('SELECT current_database()');
    console.log('📊 Connected to database:', result.rows[0].current_database);
    
    // List existing tables
    const tables = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    if (tables.rows.length > 0) {
      console.log('📋 Existing tables:');
      tables.rows.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    } else {
      console.log('📋 No tables found - database is empty');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testConnection();
