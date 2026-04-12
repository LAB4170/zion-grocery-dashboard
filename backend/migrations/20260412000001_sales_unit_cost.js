exports.up = async function(knex) {
  const hasUnitCost = await knex.schema.hasColumn('sales', 'unit_cost');
  if (!hasUnitCost) {
    await knex.schema.alterTable('sales', function(table) {
      table.decimal('unit_cost', 14, 2).defaultTo(0).notNullable();
    });
  }
};

exports.down = async function(knex) {
  const hasUnitCost = await knex.schema.hasColumn('sales', 'unit_cost');
  if (hasUnitCost) {
    await knex.schema.alterTable('sales', function(table) {
      table.dropColumn('unit_cost');
    });
  }
};
