
const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_cU5e0xVauqGR@ep-late-band-am1h9jqv-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function hardener() {
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log("🚀 Starting Master Hardening...");

    const tables = [
      'products', 'sales', 'expenses', 'debts', 
      'debt_payments', 'tenant_audit_logs', 
      'support_tickets'
    ];

    for (const table of tables) {
      console.log(`Working on ${table}...`);
      
      // 0. Add column if missing (for debt_payments)
      if (table === 'debt_payments') {
        const checkCol = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'debt_payments' AND column_name = 'business_id'`);
        if (checkCol.rows.length === 0) {
          console.log(`  - Adding missing business_id column to debt_payments...`);
          await client.query(`ALTER TABLE debt_payments ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE`);
          await client.query(`
            UPDATE debt_payments 
            SET business_id = debts.business_id 
            FROM debts 
            WHERE debt_payments.debt_id = debts.id
          `);
          console.log(`  - Backfilled business_id data`);
        }
      }

      // 1. Index
      await client.query(`CREATE INDEX IF NOT EXISTS idx_${table}_business_id ON ${table}(business_id)`);
      console.log(`  - Index created`);

      // 2. Enable RLS
      await client.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
      console.log(`  - RLS Enabled`);

      // 3. Policy
      await client.query(`DROP POLICY IF EXISTS ${table}_isolation_policy ON ${table}`);
      await client.query(`
        CREATE POLICY ${table}_isolation_policy ON ${table}
        USING (business_id::text = current_setting('app.current_business_id', true))
      `);
      console.log(`  - Isolation Policy Active`);
    }

    console.log("✅ MASTER HARDENING COMPLETE");

  } catch (err) {
    console.error("❌ HARDENING FAILED:", err.message);
    console.error(err);
  } finally {
    await client.end();
  }
}

hardener();
