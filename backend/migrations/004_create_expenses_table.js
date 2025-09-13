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
    table.uuid('created_by').nullable();
    table.timestamps(true, true);
    
    // Essential indexes only
    table.index(['category']);
    table.index(['created_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('expenses');
};
