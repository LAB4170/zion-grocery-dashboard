const { db } = require('../config/database');

async function listTables() {
  try {
    const res = await db.raw("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
    console.log('Tables in database:');
    console.log(res.rows.map(r => r.tablename));
    process.exit(0);
  } catch (error) {
    console.error('Error listing tables:', error.message);
    process.exit(1);
  }
}

listTables();
