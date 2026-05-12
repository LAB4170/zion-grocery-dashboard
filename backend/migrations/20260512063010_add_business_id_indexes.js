
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Add indexes to business_id columns across all core tables
  // This is CRITICAL for scalability and performance as the user base grows.
  
  await knex.schema.alterTable('products', table => {
    table.index('business_id', 'idx_products_business_id');
  });

  await knex.schema.alterTable('sales', table => {
    table.index('business_id', 'idx_sales_business_id');
  });

  await knex.schema.alterTable('expenses', table => {
    table.index('business_id', 'idx_expenses_business_id');
  });

  await knex.schema.alterTable('debts', table => {
    table.index('business_id', 'idx_debts_business_id');
  });

  // Also add index to audit logs for forensic performance
  const hasAuditLogs = await knex.schema.hasTable('tenant_audit_logs');
  if (hasAuditLogs) {
    await knex.schema.alterTable('tenant_audit_logs', table => {
      table.index('business_id', 'idx_audit_business_id');
      table.index('created_at', 'idx_audit_created_at');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('products', table => {
    table.dropIndex('business_id', 'idx_products_business_id');
  });

  await knex.schema.alterTable('sales', table => {
    table.dropIndex('business_id', 'idx_sales_business_id');
  });

  await knex.schema.alterTable('expenses', table => {
    table.dropIndex('business_id', 'idx_expenses_business_id');
  });

  await knex.schema.alterTable('debts', table => {
    table.dropIndex('business_id', 'idx_debts_business_id');
  });

  const hasAuditLogs = await knex.schema.hasTable('tenant_audit_logs');
  if (hasAuditLogs) {
    await knex.schema.alterTable('tenant_audit_logs', table => {
      table.dropIndex('business_id', 'idx_audit_business_id');
      table.dropIndex('created_at', 'idx_audit_created_at');
    });
  }
};
