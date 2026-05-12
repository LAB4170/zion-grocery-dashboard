
const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_cU5e0xVauqGR@ep-late-band-am1h9jqv-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function verify() {
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    
    console.log("--- 🛡️ SECURITY AUDIT: RLS STATUS ---");
    const rlsRes = await client.query("SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'");
    rlsRes.rows.forEach(r => {
      console.log(`Table: ${r.tablename.padEnd(20)} | RLS Enabled: ${r.rowsecurity ? '✅ YES' : '❌ NO'}`);
    });

    console.log("\n--- 📊 SCALABILITY AUDIT: INDEX STATUS ---");
    const indexRes = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE schemaname = 'public' AND (indexdef LIKE '%business_id%' OR indexdef LIKE '%email%')
    `);
    indexRes.rows.forEach(r => {
      console.log(`Index: ${r.indexname.padEnd(25)} | Def: ${r.indexdef}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

verify();
