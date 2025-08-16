const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del();
  
  // Hash the default admin password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash('admin123', saltRounds);
  
  // Insert default admin user
  await knex('users').insert([
    {
      id: uuidv4(),
      username: 'admin',
      email: 'admin@ziongrocery.com',
      password: hashedPassword,
      role: 'admin',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
};
