const db = require('../config/database');

class Product {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.category = data.category;
    this.price = parseFloat(data.price);
    this.stock = parseInt(data.stock);
    this.description = data.description || '';
    this.barcode = data.barcode || null;
    this.supplier = data.supplier || '';
    // FIX: Use min_stock to match database schema
    this.min_stock = parseInt(data.min_stock || data.reorder_level) || 5;
    this.cost_price = parseFloat(data.cost_price) || null;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  // Create new product with proper field mapping
  static async create(productData) {
    // Transform camelCase to snake_case for database
    const dbData = {
      id: productData.id,
      name: productData.name,
      category: productData.category,
      price: parseFloat(productData.price),
      stock: parseInt(productData.stock),
      description: productData.description || '',
      barcode: productData.barcode || null,
      supplier: productData.supplier || '',
      min_stock: parseInt(productData.min_stock || productData.reorder_level) || 5,
      cost_price: parseFloat(productData.cost_price) || null,
      is_active: productData.is_active !== undefined ? productData.is_active : true,
      created_at: productData.createdAt || productData.created_at || new Date(),
      updated_at: productData.updatedAt || productData.updated_at || new Date()
    };

    console.log('Creating product with data:', dbData);
    
    const [newProduct] = await db('products')
      .insert(dbData)
      .returning('*');
    
    console.log('Product created successfully:', newProduct);
    return newProduct;
  }

  // Get all products
  static async findAll(filters = {}) {
    let query = db('products').select('*');
    
    if (filters.category) {
      query = query.where('category', filters.category);
    }
    
    if (filters.low_stock) {
      query = query.whereRaw('stock <= min_stock');
    }
    
    if (filters.search) {
      query = query.where(function() {
        this.where('name', 'ilike', `%${filters.search}%`)
            .orWhere('description', 'ilike', `%${filters.search}%`)
            .orWhere('barcode', 'ilike', `%${filters.search}%`);
      });
    }
    
    return await query.orderBy('name', 'asc');
  }

  // Get product by ID
  static async findById(id) {
    const product = await db('products').where('id', id).first();
    return product;
  }

  // Update product
  static async update(id, updateData) {
    updateData.updated_at = new Date();
    
    const [updatedProduct] = await db('products')
      .where('id', id)
      .update(updateData)
      .returning('*');
    
    return updatedProduct;
  }

  // Delete product
  static async delete(id) {
    // Check if product is referenced in sales
    const salesCount = await db('sales').where('product_id', id).count('id as count').first();
    
    if (parseInt(salesCount.count) > 0) {
      throw new Error('Cannot delete product that has sales records');
    }
    
    return await db('products').where('id', id).del();
  }

  // Update stock
  static async updateStock(id, quantity, operation = 'subtract') {
    const product = await Product.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    
    let newStock;
    if (operation === 'subtract') {
      newStock = product.stock - quantity;
      if (newStock < 0) {
        throw new Error('Insufficient stock');
      }
    } else if (operation === 'add') {
      newStock = product.stock + quantity;
    } else {
      throw new Error('Invalid operation. Use "add" or "subtract"');
    }
    
    return await Product.update(id, { stock: newStock });
  }

  // Get low stock products
  static async getLowStock() {
    return await db('products')
      .whereRaw('stock <= min_stock')
      .orderBy('stock', 'asc');
  }

  // Get products by category
  static async getByCategory(category) {
    return await db('products')
      .where('category', category)
      .orderBy('name', 'asc');
  }

  // Get product categories
  static async getCategories() {
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
    
    if (data.stock === undefined || isNaN(parseInt(data.stock)) || parseInt(data.stock) < 0) {
      errors.push('Valid stock quantity is required');
    }
    
    return errors;
  }
}

module.exports = Product;
