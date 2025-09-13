// Lazy-loaded database connection to prevent circular dependencies
let db = null;

function getDatabase() {
  if (!db) {
    const { db: database } = require('../config/database');
    db = database;
  }
  return db;
}

class Product {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.category = data.category;
    this.price = parseFloat(data.price);
    this.stockQuantity = parseInt(data.stockQuantity || data.stock_quantity || data.stock || 0);
    this.lowStockThreshold = parseInt(data.lowStockThreshold || data.low_stock_threshold || 10);
    this.description = data.description;
    this.barcode = data.barcode;
    this.supplier = data.supplier;
    this.costPrice = parseFloat(data.costPrice || data.cost_price || 0);
    this.createdBy = data.createdBy || data.created_by;
    this.createdAt = data.createdAt || data.created_at || new Date().toISOString();
    this.updatedAt = data.updatedAt || data.updated_at;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
  }

  // Create new product with proper field mapping
  static async create(productData) {
    const db = getDatabase();
    const dbData = {
      id: productData.id || require('uuid').v4(),
      name: productData.name,
      category: productData.category,
      price: parseFloat(productData.price),
      stock_quantity: parseInt(productData.stockQuantity || productData.stock_quantity || productData.stock || 0),
      low_stock_threshold: parseInt(productData.lowStockThreshold || productData.low_stock_threshold || 10),
      description: productData.description,
      barcode: productData.barcode,
      supplier: productData.supplier,
      cost_price: parseFloat(productData.costPrice || productData.cost_price || 0),
      created_by: productData.createdBy || productData.created_by,
      created_at: productData.createdAt || productData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: productData.isActive !== undefined ? productData.isActive : true
    };

    console.log('Creating product with data:', dbData);
    
    const [newProduct] = await db('products')
      .insert(dbData)
      .returning('*');
    
    console.log('Product created successfully:', newProduct);
    return newProduct;
  }

  // Get all products with filters
  static async findAll(filters = {}) {
    const db = getDatabase();
    let query = db('products').where('is_active', true);
    
    if (filters.category) {
      query = query.where('category', filters.category);
    }
    
    if (filters.low_stock) {
      query = query.whereRaw('stock_quantity <= low_stock_threshold');
    }
    
    if (filters.search) {
      query = query.where(function() {
        this.where('name', 'ilike', `%${filters.search}%`)
            .orWhere('barcode', 'ilike', `%${filters.search}%`);
      });
    }
    
    const products = await query.orderBy('name', 'asc');
    
    // Transform to frontend format
    return products.map(product => ({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      stockQuantity: product.stock_quantity,  // Transform to camelCase
      lowStockThreshold: product.low_stock_threshold,  // Transform to camelCase
      description: product.description,
      barcode: product.barcode,
      supplier: product.supplier,
      costPrice: product.cost_price,  // Transform to camelCase
      createdBy: product.created_by,  // Transform to camelCase
      createdAt: product.created_at,  // Transform to camelCase
      updatedAt: product.updated_at,  // Transform to camelCase
      isActive: product.is_active  // Transform to camelCase
    }));
  }

  // Get product by ID
  static async findById(id) {
    const db = getDatabase();
    const product = await db('products').where('id', id).first();
    if (!product) return null;
    
    // Transform to frontend format
    return {
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      stockQuantity: product.stock_quantity,  // Transform to camelCase
      lowStockThreshold: product.low_stock_threshold,  // Transform to camelCase
      description: product.description,
      barcode: product.barcode,
      supplier: product.supplier,
      costPrice: product.cost_price,  // Transform to camelCase
      createdBy: product.created_by,  // Transform to camelCase
      createdAt: product.created_at,  // Transform to camelCase
      updatedAt: product.updated_at,  // Transform to camelCase
      isActive: product.is_active  // Transform to camelCase
    };
  }

  // Update product
  static async update(id, updateData) {
    const db = getDatabase();
    updateData.updated_at = new Date().toISOString();
    
    const [updatedProduct] = await db('products')
      .where('id', id)
      .update(updateData)
      .returning('*');
    
    return updatedProduct;
  }

  // Delete product
  static async delete(id) {
    const db = getDatabase();
    // Check if product is referenced in sales
    const salesCount = await db('sales').where('product_id', id).count('id as count').first();
    
    if (parseInt(salesCount.count) > 0) {
      throw new Error('Cannot delete product that has sales records');
    }
    
    return await db('products').where('id', id).del();
  }

  // Check if product has sales records
  static async hasSalesRecords(id) {
    const db = getDatabase();
    const salesCount = await db('sales').where('product_id', id).count('id as count').first();
    return parseInt(salesCount.count) > 0;
  }

  // Update stock
  static async updateStock(id, quantity, operation = 'subtract') {
    const product = await Product.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    
    let newStock;
    if (operation === 'subtract') {
      newStock = product.stock_quantity - quantity;
      if (newStock < 0) {
        throw new Error('Insufficient stock');
      }
    } else if (operation === 'add') {
      newStock = product.stock_quantity + quantity;
    } else {
      throw new Error('Invalid operation. Use "add" or "subtract"');
    }
    
    return await Product.update(id, { stock_quantity: newStock });
  }

  // Get low stock products
  static async getLowStock() {
    const db = getDatabase();
    return await db('products')
      .whereRaw('stock_quantity <= low_stock_threshold')
      .orderBy('stock_quantity', 'asc');
  }

  // Get products by category
  static async getByCategory(category) {
    const db = getDatabase();
    return await db('products')
      .where('category', category)
      .orderBy('name', 'asc');
  }

  // Get product categories
  static async getCategories() {
    const db = getDatabase();
    const categories = await db('products')
      .distinct('category')
      .orderBy('category', 'asc');
    
    return categories.map(cat => cat.category);
  }

  // Validate product data
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
    
    if (data.stockQuantity === undefined || isNaN(parseInt(data.stockQuantity)) || parseInt(data.stockQuantity) < 0) {
      errors.push('Valid stock quantity is required');
    }
    
    return errors;
  }
}

module.exports = Product;
