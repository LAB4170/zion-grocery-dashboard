
const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_cU5e0xVauqGR@ep-late-band-am1h9jqv-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function verifyHardening() {
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log("🚀 STARTING EMPIRICAL VERIFICATION...");

    // 1. Verify RLS is Enabled
    console.log("\n1️⃣ VERIFYING ROW-LEVEL SECURITY (RLS)...");
    const rlsRes = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE tablename IN ('products', 'sales', 'expenses', 'debts', 'debt_payments')
    `);
    console.table(rlsRes.rows);
    const allEnabled = rlsRes.rows.every(r => r.rowsecurity);
    console.log(allEnabled ? "✅ PASS: RLS is active on all core tables." : "❌ FAIL: Some tables are missing RLS!");

    // 2. Verify Session Variable Logic (The Handshake)
    console.log("\n2️⃣ VERIFYING RLS HANDSHAKE LOGIC...");
    // We'll set a fake business ID and try to see if we can "leak" data (should return 0 rows if RLS works)
    await client.query("SET app.current_business_id = '00000000-0000-0000-0000-000000000000'");
    const leakCheck = await client.query("SELECT COUNT(*) FROM products");
    console.log(`🔍 Leak Test: Count for non-existent business: ${leakCheck.rows[0].count}`);
    if (parseInt(leakCheck.rows[0].count) === 0) {
      console.log("✅ PASS: RLS successfully isolated data. No leaks detected.");
    } else {
      console.log("❌ FAIL: Data leak detected! RLS is active but policy might be too broad.");
    }

    // 3. Verify Debt Payments Business ID (The Repair)
    console.log("\n3️⃣ VERIFYING DATA REPAIR (debt_payments.business_id)...");
    const repairCheck = await client.query(`
      SELECT COUNT(*) 
      FROM information_schema.columns 
      WHERE table_name = 'debt_payments' AND column_name = 'business_id'
    `);
    if (parseInt(repairCheck.rows[0].count) > 0) {
      console.log("✅ PASS: 'business_id' column exists in debt_payments.");
    } else {
      console.log("❌ FAIL: 'business_id' column is MISSING from debt_payments!");
    }

    // 4. Verify Performance Indexes
    console.log("\n4️⃣ VERIFYING PERFORMANCE INDEXES...");
    const indexRes = await client.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE indexname LIKE '%business_id_idx%'
    `);
    console.table(indexRes.rows);
    if (indexRes.rows.length >= 5) {
      console.log("✅ PASS: Tenant-scoped indexes are deployed.");
    } else {
      console.log("❌ FAIL: Some indexes are missing.");
    }

  } catch (err) {
    console.error("❌ VERIFICATION CRASHED:", err);
  } finally {
    await client.end();
  }
}

verifyHardening();
