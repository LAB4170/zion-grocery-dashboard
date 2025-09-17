/**
 * Migration: Add helpful indexes for sales performance (created_at, date, product_id, payment_method)
 */

exports.up = async function(knex) {
  // Ensure table exists before indexing
  const hasTable = await knex.schema.hasTable('sales');
  if (!hasTable) return;

  // Create indexes (PostgreSQL supports IF NOT EXISTS)
  await knex.schema.raw(`CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales (created_at)`);
  await knex.schema.raw(`CREATE INDEX IF NOT EXISTS idx_sales_date ON sales (date)`);
  await knex.schema.raw(`CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales (product_id)`);
  await knex.schema.raw(`CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales (payment_method)`);
};

exports.down = async function(knex) {
  const hasTable = await knex.schema.hasTable('sales');
  if (!hasTable) return;

  await knex.schema.raw(`DROP INDEX IF EXISTS idx_sales_created_at`);
  await knex.schema.raw(`DROP INDEX IF EXISTS idx_sales_date`);
  await knex.schema.raw(`DROP INDEX IF EXISTS idx_sales_product_id`);
  await knex.schema.raw(`DROP INDEX IF EXISTS idx_sales_payment_method`);
};
