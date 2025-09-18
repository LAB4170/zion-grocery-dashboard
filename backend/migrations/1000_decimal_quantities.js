/**
 * Migration: Support fractional quantities
 * - products.stock_quantity: integer -> numeric(12,3)
 * - sales.quantity: integer -> numeric(12,3)
 */

exports.up = async function(knex) {
  // Ensure tables exist before altering
  const hasProducts = await knex.schema.hasTable('products');
  const hasSales = await knex.schema.hasTable('sales');

  if (hasProducts) {
    // Change products.stock_quantity to numeric(12,3)
    await knex.schema.raw(
      `ALTER TABLE products
       ALTER COLUMN stock_quantity TYPE numeric(12,3)
       USING stock_quantity::numeric`
    );
  }

  if (hasSales) {
    // Change sales.quantity to numeric(12,3)
    await knex.schema.raw(
      `ALTER TABLE sales
       ALTER COLUMN quantity TYPE numeric(12,3)
       USING quantity::numeric`
    );
  }
};

exports.down = async function(knex) {
  const hasProducts = await knex.schema.hasTable('products');
  const hasSales = await knex.schema.hasTable('sales');

  if (hasProducts) {
    // Revert to integer (rounding to nearest integer)
    await knex.schema.raw(
      `ALTER TABLE products
       ALTER COLUMN stock_quantity TYPE integer
       USING ROUND(stock_quantity)::integer`
    );
  }

  if (hasSales) {
    // Revert to integer (rounding to nearest integer)
    await knex.schema.raw(
      `ALTER TABLE sales
       ALTER COLUMN quantity TYPE integer
       USING ROUND(quantity)::integer`
    );
  }
};
