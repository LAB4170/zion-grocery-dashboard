
const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_cU5e0xVauqGR@ep-late-band-am1h9jqv-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function forceHardening() {
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log("🛠️ FORCING AGGRESSIVE HARDENING...");

    const tables = ['products', 'sales', 'expenses', 'debts', 'debt_payments'];
    
    for (const table of tables) {
      console.log(`Locking ${table}...`);
      
      // 1. Drop existing policies to be sure
      await client.query(`DROP POLICY IF EXISTS ${table}_isolation_policy ON ${table}`);
      
      // 2. Enable RLS
      await client.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
      await client.query(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY`);

      // 3. Create THE Policy (Using current_setting for maximum isolation)
      // Note: We use 'all' to cover SELECT, INSERT, UPDATE, DELETE
      await client.query(`
        CREATE POLICY ${table}_isolation_policy ON ${table}
        FOR ALL
        USING (business_id = current_setting('app.current_business_id')::uuid)
        WITH CHECK (business_id = current_setting('app.current_business_id')::uuid)
      `);

      // 4. Create the Index (Hard force)
      await client.query(`DROP INDEX IF EXISTS ${table}_business_id_idx`);
      await client.query(`CREATE INDEX ${table}_business_id_idx ON ${table} (business_id)`);
      
      console.log(`✅ ${table} is now an isolated fortress.`);
    }

    console.log("\n✅ ALL CORE TABLES HARDENED WITH AGGRESSIVE POLICIES.");

  } catch (err) {
    console.error("❌ HARDENING FAILED:", err.message);
  } finally {
    await client.end();
  }
}

forceHardening();
