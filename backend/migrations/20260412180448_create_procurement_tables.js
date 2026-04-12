/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('suppliers', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.string('contact_person');
      table.string('phone');
      table.string('email');
      table.string('category');
      table.text('address');
      table.uuid('business_id').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('purchase_orders', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('supplier_id').references('id').inTable('suppliers').onDelete('CASCADE');
      table.uuid('business_id').notNullable();
      table.string('reference_number'); // e.g. LPO-001
      table.decimal('total_amount', 15, 2).notNullable();
      table.string('status').defaultTo('received'); // draft, ordered, received
      table.timestamp('received_at').defaultTo(knex.fn.now());
      table.text('notes');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('po_items', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('purchase_order_id').references('id').inTable('purchase_orders').onDelete('CASCADE');
      table.uuid('product_id').notNullable();
      table.decimal('quantity', 15, 3).notNullable();
      table.decimal('unit_cost', 15, 2).notNullable();
      table.decimal('subtotal', 15, 2).notNullable();
    })
    .alterTable('products', table => {
      // Allow linking a default supplier to a product for auto-replenishment later
      table.uuid('supplier_id').nullable().references('id').inTable('suppliers').onDelete('SET NULL');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .alterTable('products', table => {
      table.dropColumn('supplier_id');
    })
    .dropTableIfExists('po_items')
    .dropTableIfExists('purchase_orders')
    .dropTableIfExists('suppliers');
};
