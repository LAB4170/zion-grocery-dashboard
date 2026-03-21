/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('businesses', function(table) {
    table.string('subscription_status').notNullable().defaultTo('trial');
    // Using raw SQL for precise 14-day default in Postgres
    table.timestamp('trial_ends_at').notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP + interval '14 days'"));
    table.timestamp('subscription_ends_at').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('businesses', function(table) {
    table.dropColumn('subscription_status');
    table.dropColumn('trial_ends_at');
    table.dropColumn('subscription_ends_at');
  });
};
