exports.up = async function(knex) {
  // 1. Create sale_items table
  await knex.schema.createTable('sale_items', (table) => {
    table.uuid('id').primary();
    table.uuid('sale_id').references('id').inTable('sales').onDelete('CASCADE').notNullable();
    table.uuid('product_id').references('id').inTable('products').onDelete('SET NULL');
    table.string('product_name').notNullable();
    table.decimal('quantity', 14, 3).notNullable();
    table.decimal('unit_price', 14, 2).notNullable();
    table.decimal('unit_cost', 14, 2).notNullable();
    table.decimal('total', 14, 2).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 2. Adjust sales table to be item-agnostic (aggregates only)
  await knex.schema.alterTable('sales', (table) => {
    // Current fields move to items table, so we make them nullable at top level
    table.uuid('product_id').nullable().alter();
    table.string('product_name').nullable().alter();
    table.decimal('quantity', 14, 3).nullable().alter();
    table.decimal('unit_price', 14, 2).nullable().alter();
    table.decimal('unit_cost', 14, 2).nullable().alter();
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('sale_items');
  await knex.schema.alterTable('sales', (table) => {
    table.uuid('product_id').notNullable().alter();
    table.string('product_name').notNullable().alter();
    table.decimal('quantity', 14, 3).notNullable().alter();
    table.decimal('unit_price', 14, 2).notNullable().alter();
    table.decimal('unit_cost', 14, 2).notNullable().alter();
  });
};
