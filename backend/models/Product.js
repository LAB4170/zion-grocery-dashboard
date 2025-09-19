// Lazy-loaded database connection to prevent circular dependencies
let db = null;

function getDatabase() {
  if (!db) {
    const { db: database } = require('../config/database');
    db = database;
  }
  return db;
}

const { v4: uuidv4 } = require('uuid');

class Product {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.category = data.category;
    this.price = parseFloat(data.price);
    this.stockQuantity = parseFloat(data.stockQuantity || data.stock_quantity || 0);
    this.createdAt = data.createdAt || data.created_at || new Date().toISOString();
    this.updatedAt = data.updatedAt || data.updated_at;
  }

  // Create new product with simplified fields
  static async create(productData) {
    const db = getDatabase();
    const dbData = {
      id: productData.id || uuidv4(),
      name: productData.name,
      category: productData.category,
      price: parseFloat(productData.price),
      stock_quantity: parseFloat(productData.stockQuantity || productData.stock_quantity || 0),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Creating product with simplified data:', dbData);
    
    const [newProduct] = await db('products')
      .insert(dbData)
      .returning('*');
    
    console.log('Product created successfully:', newProduct);
    return newProduct;
  }

  // Get all products with basic filters
  static async findAll(filters = {}) {
    const db = getDatabase();
    let query = db('products');
    
    if (filters.category) {
      query = query.where('category', filters.category);
    }
    
    if (filters.search) {
      query = query.where('name', 'ilike', `%${filters.search}%`);
    }
    
    const products = await query.orderBy('name', 'asc');
    
    // Transform to frontend format (camelCase)
    return products.map(product => ({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      stockQuantity: parseFloat(product.stock_quantity),
      createdAt: product.created_at,
      updatedAt: product.updated_at
    }));
  }

  // New: server-side pagination with filters and sorting
  static async findPaginated({ category, search } = {}, { page = 1, perPage = 25, sortBy = 'name', sortDir = 'asc' } = {}) {
    const dbx = getDatabase();
    let base = dbx('products');

    if (category) base = base.where('category', category);
    if (search) base = base.where('name', 'ilike', `%${search}%`);

    const [{ count }] = await base.clone().count('* as count');
    const total = parseInt(count) || 0;

    const safePerPage = Math.min(Math.max(parseInt(perPage) || 25, 1), 1000);
    const safePage = Math.max(parseInt(page) || 1, 1);
    const offset = (safePage - 1) * safePerPage;

    const rows = await base
      .clone()
      .select('*')
      .orderBy(sortBy, sortDir.toLowerCase() === 'desc' ? 'desc' : 'asc')
      .limit(safePerPage)
      .offset(offset);

    const items = rows.map(product => ({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      stockQuantity: parseFloat(product.stock_quantity),
      createdAt: product.created_at,
      updatedAt: product.updated_at
    }));

    return {
      items,
      total,
      page: safePage,
      perPage: safePerPage,
      totalPages: Math.max(Math.ceil(total / safePerPage), 1)
    };
  }

  // Get product by ID
  static async findById(id) {
    const db = getDatabase();
    const product = await db('products').where('id', id).first();
    if (!product) return null;
    
    // Transform to frontend format (camelCase)
    return {
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      stockQuantity: parseFloat(product.stock_quantity),
      createdAt: product.created_at,
      updatedAt: product.updated_at
    };
  }

  // Update product
  static async update(id, updateData) {
    const db = getDatabase();
    const dbData = { updated_at: new Date().toISOString() };

    // Only set fields that were provided
    if (updateData.hasOwnProperty('name')) {
      dbData.name = updateData.name;
    }
    if (updateData.hasOwnProperty('category')) {
      dbData.category = updateData.category;
    }
    if (updateData.hasOwnProperty('price')) {
      dbData.price = parseFloat(updateData.price);
    }

    // Allow stock updates when explicitly provided; validate non-negative number
    if (updateData.hasOwnProperty('stockQuantity') || updateData.hasOwnProperty('stock_quantity')) {
      const rawStock = updateData.stockQuantity ?? updateData.stock_quantity;
      const parsed = parseFloat(rawStock);
      if (isNaN(parsed) || parsed < 0) {
        throw new Error('Invalid stock quantity. It must be a non-negative number.');
      }
      dbData.stock_quantity = parsed;
    }
    
    const [updatedProduct] = await db('products')
      .where('id', id)
      .update(dbData)
      .returning('*');
    
    return updatedProduct;
  }

  // Check if product has sales records
  static async hasSalesRecords(productId) {
    const db = getDatabase();
    const salesCount = await db('sales')
      .where('product_id', productId)
      .count('id as count')
      .first();
    
    return parseInt(salesCount.count) > 0;
  }

  // Delete product
  static async delete(id) {
    if (await Product.hasSalesRecords(id)) {
      throw new Error('Cannot delete product that has sales records');
    }
    
    const db = getDatabase();
    return await db('products').where('id', id).del();
  }

  // Update stock (for sales)
  static async updateStock(id, quantity, operation = 'subtract') {
    const db = getDatabase();
    const product = await Product.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    
    let newStock;
    if (operation === 'subtract') {
      newStock = product.stockQuantity - quantity;
      if (newStock < 0) {
        throw new Error('Insufficient stock');
      }
    } else if (operation === 'add') {
      newStock = product.stockQuantity + quantity;
    } else {
      throw new Error('Invalid operation. Use "add" or "subtract"');
    }
    
    return await Product.update(id, { stockQuantity: newStock });
  }

  // Get product categories
  static async getCategories() {
    const db = getDatabase();
    const categories = await db('products')
      .distinct('category')
      .orderBy('category', 'asc');
    
    return categories.map(cat => cat.category);
  }

  // Simple validation matching frontend
  static validate(data) {
    const errors = [];
    
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Product name is required');
    }
    
    if (!data.category || data.category.trim().length === 0) {
      errors.push('Product category is required');
    }
    
    if (!data.price || isNaN(parseFloat(data.price)) || parseFloat(data.price) <= 0) {
      errors.push('Valid price is required');
    }
    
    if (data.stockQuantity === undefined || isNaN(parseFloat(data.stockQuantity)) || parseFloat(data.stockQuantity) < 0) {
      errors.push('Valid stock quantity is required');
    }
    
    return errors;
  }

  // Validation for partial updates (PUT) - only validates fields provided
  static validateUpdate(data) {
    const errors = [];

    if (data.hasOwnProperty('name')) {
      if (data.name === undefined || data.name === null || data.name.toString().trim().length === 0) {
        errors.push('Product name cannot be empty');
      }
    }

    if (data.hasOwnProperty('category')) {
      if (data.category === undefined || data.category === null || data.category.toString().trim().length === 0) {
        errors.push('Product category cannot be empty');
      }
    }

    if (data.hasOwnProperty('price')) {
      if (isNaN(parseFloat(data.price)) || parseFloat(data.price) <= 0) {
        errors.push('Valid price is required');
      }
    }

    if (data.hasOwnProperty('stockQuantity') || data.hasOwnProperty('stock_quantity')) {
      const raw = data.stockQuantity ?? data.stock_quantity;
      const parsed = parseFloat(raw);
      if (isNaN(parsed) || parsed < 0) {
        errors.push('Valid stock quantity is required');
      }
    }

    return errors;
  }
}

module.exports = Product;
