/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function up(knex) {
  const hasStatus = await knex.schema.hasColumn('expenses', 'status');
  const hasApprovedBy = await knex.schema.hasColumn('expenses', 'approved_by');
  const hasApprovedAt = await knex.schema.hasColumn('expenses', 'approved_at');

  await knex.schema.alterTable('expenses', (table) => {
    if (!hasStatus) table.string('status').defaultTo('pending');
    if (!hasApprovedBy) table.string('approved_by').nullable();
    if (!hasApprovedAt) table.timestamp('approved_at').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function down(knex) {
  const hasStatus = await knex.schema.hasColumn('expenses', 'status');
  const hasApprovedBy = await knex.schema.hasColumn('expenses', 'approved_by');
  const hasApprovedAt = await knex.schema.hasColumn('expenses', 'approved_at');

  await knex.schema.alterTable('expenses', (table) => {
    if (hasStatus) table.dropColumn('status');
    if (hasApprovedBy) table.dropColumn('approved_by');
    if (hasApprovedAt) table.dropColumn('approved_at');
  });
};
