const { v4: uuidv4 } = require('uuid');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('products').del();
  
  // Insert sample products
  await knex('products').insert([
    {
      id: uuidv4(),
      name: 'White Bread',
      category: 'Bakery',
      price: 50.00,
      stock: 25,
      min_stock: 10,
      description: 'Fresh white bread loaf',
      supplier: 'Local Bakery',
      cost_price: 35.00,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Milk 1L',
      category: 'Dairy',
      price: 120.00,
      stock: 30,
      min_stock: 15,
      description: 'Fresh whole milk 1 liter',
      supplier: 'Dairy Farm Co.',
      cost_price: 90.00,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Rice 2kg',
      category: 'Grains',
      price: 180.00,
      stock: 20,
      min_stock: 8,
      description: 'Premium white rice 2kg pack',
      supplier: 'Rice Suppliers Ltd',
      cost_price: 140.00,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Cooking Oil 500ml',
      category: 'Cooking',
      price: 200.00,
      stock: 15,
      min_stock: 10,
      description: 'Sunflower cooking oil 500ml',
      supplier: 'Oil Distributors',
      cost_price: 160.00,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Sugar 1kg',
      category: 'Pantry',
      price: 130.00,
      stock: 12,
      min_stock: 8,
      description: 'White granulated sugar 1kg',
      supplier: 'Sugar Mills',
      cost_price: 100.00,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Eggs (12 pieces)',
      category: 'Dairy',
      price: 300.00,
      stock: 8,
      min_stock: 5,
      description: 'Fresh chicken eggs - 12 pieces',
      supplier: 'Poultry Farm',
      cost_price: 240.00,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Tomatoes 1kg',
      category: 'Vegetables',
      price: 80.00,
      stock: 5,
      min_stock: 10,
      description: 'Fresh tomatoes per kilogram',
      supplier: 'Local Farmers',
      cost_price: 60.00,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Onions 1kg',
      category: 'Vegetables',
      price: 100.00,
      stock: 18,
      min_stock: 12,
      description: 'Fresh onions per kilogram',
      supplier: 'Local Farmers',
      cost_price: 75.00,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
};
