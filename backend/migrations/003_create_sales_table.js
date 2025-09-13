/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('sales', function(table) {
    table.uuid('id').primary();
    table.uuid('product_id').notNullable();
    table.string('product_name', 100).notNullable();
    table.integer('quantity').notNullable();
    table.decimal('unit_price', 10, 2).notNullable();
    table.decimal('total', 10, 2).notNullable();
    table.enum('payment_method', ['cash', 'mpesa', 'debt']).notNullable();
    table.string('customer_name', 100).nullable();
    table.string('customer_phone', 20).nullable();
    table.enum('status', ['completed', 'pending']).defaultTo('completed');
    table.string('mpesa_code', 50).nullable();
    table.text('notes').nullable();
    table.date('date').nullable();
    table.uuid('created_by').nullable();
    table.timestamps(true, true);
    
    // Foreign keys - simplified
    table.foreign('product_id').references('id').inTable('products').onDelete('RESTRICT');
    
    // Essential indexes only
    table.index(['product_id']);
    table.index(['payment_method']);
    table.index(['status']);
    table.index(['created_at']);
    table.index(['customer_phone']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('sales');
};
