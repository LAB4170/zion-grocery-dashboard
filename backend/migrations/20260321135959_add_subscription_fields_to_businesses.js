/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('businesses', table => {
    table.string('subscription_status').defaultTo('trial'); // trial, active, past_due, canceled
    table.timestamp('trial_ends_at');
    table.timestamp('subscription_ends_at');
    table.string('mpesa_number').nullable(); // Preferred payment number
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
