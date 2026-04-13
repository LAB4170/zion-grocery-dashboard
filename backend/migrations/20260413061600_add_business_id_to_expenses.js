/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasBusinessId = await knex.schema.hasColumn('expenses', 'business_id');
  if (!hasBusinessId) {
    return knex.schema.alterTable('expenses', table => {
      table.uuid('business_id').nullable().references('id').inTable('businesses').onDelete('CASCADE');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('expenses', table => {
    table.dropColumn('business_id');
  });
};
