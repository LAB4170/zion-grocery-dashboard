
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. ADD MISSING BUSINESS_ID TO DEBT_PAYMENTS
  const hasBusinessId = await knex.schema.hasColumn('debt_payments', 'business_id');
  if (!hasBusinessId) {
    await knex.schema.alterTable('debt_payments', table => {
      table.uuid('business_id').references('id').inTable('businesses').onDelete('CASCADE');
    });

    // BACKFILL: Sync business_id from the parent debt record
    await knex.raw(`
      UPDATE debt_payments 
      SET business_id = debts.business_id 
      FROM debts 
      WHERE debt_payments.debt_id = debts.id
    `);
  }

  // 2. SCALABILITY: Add missing performance indexes
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_products_business_id ON products(business_id)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_sales_business_id ON sales(business_id)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_expenses_business_id ON expenses(business_id)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_debts_business_id ON debts(business_id)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_debt_payments_business_id ON debt_payments(business_id)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_support_tickets_business_id ON support_tickets(business_id)');

  // 3. SECURITY: Activate Row-Level Security (RLS) on ALL sensitive tables
  const tables = [
    'products', 'sales', 'expenses', 'debts', 
    'debt_payments', 'tenant_audit_logs', 
    'support_tickets'
  ];

  for (const table of tables) {
    const hasTable = await knex.schema.hasTable(table);
    if (!hasTable) {
      console.log(`⚠️ Skipping RLS for non-existent table: ${table}`);
      continue;
    }

    // Enable RLS
    await knex.raw(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
    
    // Create Policy: Each business can only see its own rows
    await knex.raw(`DROP POLICY IF EXISTS ${table}_isolation_policy ON ${table}`);
    await knex.raw(`
      CREATE POLICY ${table}_isolation_policy ON ${table}
      USING (business_id::text = current_setting('app.current_business_id', true))
    `);
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const tables = [
    'products', 'sales', 'expenses', 'debts', 
    'debt_payments', 'tenant_audit_logs', 
    'support_tickets'
  ];

  for (const table of tables) {
    await knex.raw(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY`);
    await knex.raw(`DROP POLICY IF EXISTS ${table}_isolation_policy ON ${table}`);
  }

  await knex.schema.alterTable('debt_payments', table => {
    table.dropColumn('business_id');
  });

  await knex.raw('DROP INDEX IF EXISTS idx_products_business_id');
  await knex.raw('DROP INDEX IF EXISTS idx_sales_business_id');
  await knex.raw('DROP INDEX IF EXISTS idx_expenses_business_id');
  await knex.raw('DROP INDEX IF EXISTS idx_debts_business_id');
  await knex.raw('DROP INDEX IF EXISTS idx_debt_payments_business_id');
  await knex.raw('DROP INDEX IF EXISTS idx_support_tickets_business_id');
};
