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
  },
  migrations: {
    directory: path.join(__dirname, 'migrations'),
    tableName: 'knex_migrations'
  }
};

const db = knex(config);

async function migrate() {
  console.log('Starting migrations...');
  try {
    const [batchNo, log] = await db.migrate.latest();
    if (log.length === 0) {
      console.log('Already up to date');
    } else {
      console.log('Batch', batchNo, 'run:', log.length, 'migrations');
      console.log(log.join('\n'));
    }
  } catch (err) {
    console.error('Migration failed:', err.message);
    if (err.stack) console.error(err.stack);
  } finally {
    await db.destroy();
  }
}

migrate();
