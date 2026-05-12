
const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_cU5e0xVauqGR@ep-late-band-am1h9jqv-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function checkRLS() {
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    
    // Check RLS
    const rlsQuery = "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'";
    const rlsRes = await client.query(rlsQuery);
    console.log("🛡️ ROW-LEVEL SECURITY STATUS:");
    console.table(rlsRes.rows);
    
    // Check Indexes for Multi-Tenancy
    const indexQuery = `
      SELECT
          t.relname as table_name,
          i.relname as index_name,
          a.attname as column_name
      FROM
          pg_class t,
          pg_class i,
          pg_index ix,
          pg_attribute a
      WHERE
          t.oid = ix.indrelid
          AND i.oid = ix.indexrelid
          AND a.attrelid = t.oid
          AND a.attnum = ANY(ix.indkey)
          AND t.relkind = 'r'
          AND a.attname = 'business_id'
      ORDER BY
          t.relname;
    `;
    const indexRes = await client.query(indexQuery);
    console.log("📊 MULTI-TENANCY INDEXES:");
    console.table(indexRes.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkRLS();
