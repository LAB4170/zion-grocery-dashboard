const knex = require('knex');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const config = {
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'zion_grocery_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  }
};

const db = knex(config);

async function test() {
  console.log('Testing connection with config:', JSON.stringify({ ...config, connection: { ...config.connection, password: '****' } }, null, 2));
  try {
    const result = await db.raw('SELECT 1+1 as result');
    console.log('Connection successful:', result.rows);
  } catch (err) {
    console.error('Connection failed:', err.message);
  } finally {
    await db.destroy();
  }
}

test();
