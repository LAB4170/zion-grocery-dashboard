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
    table.decimal('amount_paid', 10, 2).defaultTo(0);
    table.decimal('balance', 10, 2).notNullable();
    table.enum('status', ['pending', 'partial', 'paid', 'overdue']).defaultTo('pending');
    table.date('due_date').nullable();
    table.text('notes').nullable();
    table.uuid('created_by').nullable();
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('sale_id').references('id').inTable('sales').onDelete('SET NULL');
    table.foreign('created_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Indexes
    table.index(['customer_name']);
    table.index(['customer_phone']);
    table.index(['status']);
    table.index(['due_date']);
    table.index(['created_by']);
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
