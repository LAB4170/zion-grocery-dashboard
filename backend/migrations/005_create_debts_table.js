/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('debts', function(table) {
    table.uuid('id').primary();
    table.uuid('sale_id').nullable();
    table.string('customer_name', 100).notNullable();
    table.string('customer_phone', 20).nullable();
    table.decimal('amount', 10, 2).notNullable();
    table.enum('status', ['pending', 'paid']).defaultTo('pending');
    table.text('notes').nullable();
    table.uuid('created_by').nullable();
    table.timestamps(true, true);
    
    // Foreign keys - simplified
    table.foreign('sale_id').references('id').inTable('sales').onDelete('SET NULL');
    
    // Essential indexes only
    table.index(['customer_name']);
    table.index(['customer_phone']);
    table.index(['status']);
    table.index(['created_at']);
    table.index(['sale_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('debts');
};
