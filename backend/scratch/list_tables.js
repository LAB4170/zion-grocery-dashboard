
const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_cU5e0xVauqGR@ep-late-band-am1h9jqv-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function listTables() {
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    const query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'";
    const res = await client.query(query);
    console.log("📊 TABLES IN DATABASE:");
    console.table(res.rows);
    
    const tables = res.rows.map(r => r.table_name);
    const required = ['support_tickets', 'support_messages', 'admin_audit_log', 'tenant_audit_logs'];
    const missing = required.filter(t => !tables.includes(t));
    
    if (missing.length > 0) {
      console.warn("⚠️ MISSING TABLES:", missing.join(', '));
    } else {
      console.log("✅ All required admin tables are present.");
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

listTables();
