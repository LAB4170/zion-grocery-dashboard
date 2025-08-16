/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('expenses', function(table) {
    table.uuid('id').primary();
    table.string('description', 255).notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.string('category', 50).notNullable();
    table.enum('status', ['pending', 'approved', 'rejected']).defaultTo('pending');
    table.date('expense_date').notNullable();
    table.string('receipt_number', 50).nullable();
    table.text('notes').nullable();
    table.uuid('created_by').nullable();
    table.uuid('approved_by').nullable();
    table.timestamp('approved_at').nullable();
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.foreign('approved_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Indexes
    table.index(['category']);
    table.index(['status']);
    table.index(['expense_date']);
    table.index(['created_by']);
    table.index(['approved_by']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('expenses');
};
