
const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_cU5e0xVauqGR@ep-late-band-am1h9jqv-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function checkIndexes() {
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    const query = `
      SELECT 
        t.relname as table_name, 
        a.attname as column_name, 
        i.relname as index_name 
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
        AND t.relname IN ('products', 'sales', 'expenses', 'debts') 
        AND a.attname = 'business_id'
    `;
    
    const res = await client.query(query);
    console.log("📊 INDEX DIAGNOSTIC:");
    console.table(res.rows);
    
    // Check RLS Status
    const rlsQuery = `
      SELECT 
        relname as table_name, 
        relrowsecurity as rls_enabled 
      FROM pg_class 
      WHERE relname IN ('products', 'sales', 'expenses', 'debts', 'businesses')
    `;
    const rlsRes = await client.query(rlsQuery);
    console.log("🛡️ RLS STATUS DIAGNOSTIC:");
    console.table(rlsRes.rows);

    // Check RLS Policies
    const policyQuery = `
      SELECT 
        schemaname, 
        tablename, 
        policyname, 
        permissive, 
        roles, 
        cmd, 
        qual, 
        with_check 
      FROM pg_policies 
      WHERE tablename IN ('products', 'sales', 'expenses', 'debts')
    `;
    const policyRes = await client.query(policyQuery);
    console.log("📜 RLS POLICIES DIAGNOSTIC:");
    console.table(policyRes.rows);
    
    // Check which ones are MISSING
    const tables = ['products', 'sales', 'expenses', 'debts'];
    const indexedTables = res.rows.map(r => r.table_name);
    const missing = tables.filter(t => !indexedTables.includes(t));
    
    if (missing.length > 0) {
      console.warn("⚠️ MISSING INDEXES DETECTED ON:", missing.join(', '));
    } else {
      console.log("✅ All core tables have business_id indexes.");
    }
    
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkIndexes();
