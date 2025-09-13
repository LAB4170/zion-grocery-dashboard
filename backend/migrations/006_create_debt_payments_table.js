/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  // Debt payments table removed - using simplified debt management
  // Debts are now marked as 'pending' or 'paid' without detailed payment tracking
  return Promise.resolve();
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // No table to drop since we're not creating one
  return Promise.resolve();
};
