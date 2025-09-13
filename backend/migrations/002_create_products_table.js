/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('products', function(table) {
    table.uuid('id').primary();
    table.string('name', 100).notNullable();
    table.string('category', 50).notNullable();
    table.decimal('price', 10, 2).notNullable();
    table.integer('stock_quantity').defaultTo(0);
    table.timestamps(true, true);
    
    // Essential indexes only
    table.index(['name']);
    table.index(['category']);
    table.index(['stock_quantity']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('products');
};
