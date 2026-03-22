const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'EobordTech-POS',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
});

async function makeEvergreen() {
  await client.connect();
  try {
    const res = await client.query(`
      UPDATE businesses 
      SET subscription_status = 'active', 
          subscription_ends_at = '2099-12-31'
    `);
    console.log(`✅ Updated ${res.rowCount} businesses to Evergreen status.`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

makeEvergreen();
