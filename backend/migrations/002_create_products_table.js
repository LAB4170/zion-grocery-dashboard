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
    table.integer('stock').defaultTo(0);
    table.integer('min_stock').defaultTo(10);
    table.text('description').nullable();
    table.string('barcode', 50).nullable().unique();
    table.string('supplier', 100).nullable();
    table.decimal('cost_price', 10, 2).nullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Indexes
    table.index(['name']);
    table.index(['category']);
    table.index(['barcode']);
    table.index(['is_active']);
    table.index(['stock']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('products');
};
