/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('tenant_audit_logs', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('business_id').references('id').inTable('businesses').onDelete('CASCADE').notNullable();
    table.string('user_email').notNullable();
    table.string('action').notNullable(); // CREATE, UPDATE, DELETE
    table.string('entity_type').notNullable(); // PRODUCT, SALE, etc.
    table.string('entity_id').notNullable();
    table.jsonb('old_data');
    table.jsonb('new_data');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['business_id', 'created_at']);
    table.index(['entity_type', 'entity_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('tenant_audit_logs');
};
