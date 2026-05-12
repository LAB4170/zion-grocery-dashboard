
const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_cU5e0xVauqGR@ep-late-band-am1h9jqv-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function markComplete() {
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    await client.query("INSERT INTO knex_migrations (name, batch, migration_time) VALUES ($1, (SELECT MAX(batch) FROM knex_migrations), NOW())", ['20260512095252_master_security_hardening.js']);
    console.log('✅ Master Hardening marked as complete in knex_migrations');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

markComplete();
