/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('debt_payments', function(table) {
    table.uuid('id').primary();
    table.uuid('debt_id').notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.enum('payment_method', ['cash', 'mpesa']).notNullable();
    table.string('mpesa_code', 50).nullable();
    table.text('notes').nullable();
    table.uuid('received_by').nullable();
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('debt_id').references('id').inTable('debts').onDelete('CASCADE');
    table.foreign('received_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Indexes
    table.index(['debt_id']);
    table.index(['payment_method']);
    table.index(['mpesa_code']);
    table.index(['created_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('debt_payments');
};
