// Default admin user seed removed - JWT authentication disabled
// System now uses simple frontend authentication with ZionGroceries/Zion123$

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // No database users needed for simple authentication
  console.log('Skipping user seed - using simple frontend authentication');
};
