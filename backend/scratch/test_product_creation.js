const { db } = require('../config/database');
const Product = require('../models/Product');

async function test() {
  try {
    const business = await db('businesses').first();
    if (!business) {
      console.log('No business found. Please create one first.');
      process.exit(0);
    }
    console.log('Testing with business:', business.id, business.name);

    const productData = {
      name: 'Test Product ' + Date.now(),
      category: 'Test Category',
      price: 100.50,
      stockQuantity: 50,
      businessId: business.id,
      businessCategory: business.business_category || 'retail'
    };

    console.log('Creating product...');
    const product = await Product.create(productData);
    console.log('Product returned to caller:', product);
    console.log('Product ID:', product.id);
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

test();
