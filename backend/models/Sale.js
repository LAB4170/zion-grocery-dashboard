const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Sale {
  constructor(data) {
    this.id = data.id; 
    this.product_id = data.product_id;
    this.product_name = data.product_name;
    this.quantity = parseInt(data.quantity);
    this.unit_price = parseFloat(data.unit_price);
    this.total = parseFloat(data.total);
    this.payment_method = data.payment_method; // 'cash', 'mpesa', 'debt'
    this.customer_name = data.customer_name || '';
    this.customer_phone = data.customer_phone || '';
    this.status = data.status || 'completed'; // 'completed', 'pending', 'cancelled'
    this.mpesa_code = data.mpesa_code || null; // M-Pesa transaction code
    this.notes = data.notes || null; // Additional notes
    this.created_by = data.created_by || data.user_id || null; // Handle both field names
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  // Create new sale
  static async create(saleData) {
    const sale = new Sale(saleData);
    
    // Generate UUID if not provided
    if (!sale.id) {
      sale.id = uuidv4();
    }
    
    // Start transaction
    const trx = await db.transaction();
    
    try {
      // Check product stock - FIX: Use correct field name 'stock_quantity'
      const product = await trx('products').where('id', sale.product_id).first();
      if (!product) {
        throw new Error('Product not found');
      }
      
      if (product.stock_quantity < sale.quantity) {
        throw new Error('Insufficient stock');
      }
      
      // Create sale record with UUID
      const [newSale] = await trx('sales')
        .insert({
          id: sale.id, // Include UUID primary key
          product_id: sale.product_id,
          product_name: sale.product_name,
          quantity: sale.quantity,
          unit_price: sale.unit_price,
          total: sale.total,
          payment_method: sale.payment_method,
          customer_name: sale.customer_name,
          customer_phone: sale.customer_phone,
          status: sale.status,
          mpesa_code: sale.mpesa_code,
          notes: sale.notes,
          created_by: sale.created_by,
          created_at: sale.created_at,
          updated_at: sale.updated_at
        })
        .returning('*');
      
      // Update product stock - FIX: Use correct field name 'stock_quantity'
      await trx('products')
        .where('id', sale.product_id)
        .decrement('stock_quantity', sale.quantity)
        .update('updated_at', new Date());
      
      // If payment method is debt, create debt record with correct schema
      if (sale.payment_method === 'debt') {
        await trx('debts').insert({
          sale_id: newSale.id,
          customer_name: sale.customer_name,
          customer_phone: sale.customer_phone,
          amount: sale.total,
          amount_paid: 0, // New schema field
          balance: sale.total, // New schema field
          status: 'pending',
          notes: `Sale: ${sale.product_name} (${sale.quantity} units)`,
          created_by: sale.created_by,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
      
      await trx.commit();
      return newSale;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  // Get all sales
  static async findAll(filters = {}) {
    let query = db('sales')
      .select('sales.*', 'products.name as product_name')
      .leftJoin('products', 'sales.product_id', 'products.id');
    
    if (filters.date_from) {
      query = query.where('sales.created_at', '>=', filters.date_from);
    }
    
    if (filters.date_to) {
      query = query.where('sales.created_at', '<=', filters.date_to);
    }
    
    if (filters.payment_method) {
      query = query.where('sales.payment_method', filters.payment_method);
    }
    
    if (filters.status) {
      query = query.where('sales.status', filters.status);
    }
    
    if (filters.customer_name) {
      query = query.where('sales.customer_name', 'ilike', `%${filters.customer_name}%`);
    }
    
    return await query.orderBy('sales.created_at', 'desc');
  }

  // Get sale by ID
  static async findById(id) {
    const sale = await db('sales')
      .select('sales.*', 'products.name as product_name')
      .leftJoin('products', 'sales.product_id', 'products.id')
      .where('sales.id', id)
      .first();
    
    return sale;
  }

  // Update sale
  static async update(id, updateData) {
    updateData.updated_at = new Date();
    
    const [updatedSale] = await db('sales')
      .where('id', id)
      .update(updateData)
      .returning('*');
    
    return updatedSale;
  }

  // Delete sale
  static async delete(id) {
    const trx = await db.transaction();
    
    try {
      // Get sale details
      const sale = await trx('sales').where('id', id).first();
      if (!sale) {
        throw new Error('Sale not found');
      }
      
      // Restore product stock
      await trx('products')
        .where('id', sale.product_id)
        .increment('stock_quantity', sale.quantity)
        .update('updated_at', new Date());
      
      // Delete associated debt if exists
      await trx('debts').where('sale_id', id).del();
      
      // Delete sale
      await trx('sales').where('id', id).del();
      
      await trx.commit();
      return true;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  // Get sales summary
  static async getSummary(filters = {}) {
    let query = db('sales');
    
    if (filters.date_from) {
      query = query.where('created_at', '>=', filters.date_from);
    }
    
    if (filters.date_to) {
      query = query.where('created_at', '<=', filters.date_to);
    }
    
    const summary = await query
      .select(
        db.raw('COUNT(*) as total_sales'),
        db.raw('SUM(total) as total_revenue'),
        db.raw('SUM(CASE WHEN payment_method = ? THEN total ELSE 0 END) as cash_sales', ['cash']),
        db.raw('SUM(CASE WHEN payment_method = ? THEN total ELSE 0 END) as mpesa_sales', ['mpesa']),
        db.raw('SUM(CASE WHEN payment_method = ? THEN total ELSE 0 END) as debt_sales', ['debt']),
        db.raw('AVG(total) as average_sale_value')
      )
      .first();
    
    return {
      total_sales: parseInt(summary.total_sales) || 0,
      total_revenue: parseFloat(summary.total_revenue) || 0,
      cash_sales: parseFloat(summary.cash_sales) || 0,
      mpesa_sales: parseFloat(summary.mpesa_sales) || 0,
      debt_sales: parseFloat(summary.debt_sales) || 0,
      average_sale_value: parseFloat(summary.average_sale_value) || 0
    };
  }

  // Get daily sales
  static async getDailySales(days = 7) {
    const sales = await db('sales')
      .select(
        db.raw('DATE(created_at) as date'),
        db.raw('COUNT(*) as count'),
        db.raw('SUM(total) as total')
      )
      .where('created_at', '>=', db.raw(`NOW() - INTERVAL '${days} days'`))
      .groupBy(db.raw('DATE(created_at)'))
      .orderBy('date', 'desc');
    
    return sales;
  }

  // Get top selling products
  static async getTopProducts(limit = 10) {
    const products = await db('sales')
      .select('product_name', 'product_id')
      .sum('quantity as total_quantity')
      .sum('total as total_revenue')
      .count('* as sale_count')
      .groupBy('product_id', 'product_name')
      .orderBy('total_quantity', 'desc')
      .limit(limit);
    
    return products;
  }

  // Validate sale data
  static validate(data) {
    const errors = [];
    
    if (!data.product_id) {
      errors.push('Product ID is required');
    }
    
    if (!data.quantity || isNaN(parseInt(data.quantity)) || parseInt(data.quantity) <= 0) {
      errors.push('Valid quantity is required');
    }
    
    if (!data.unit_price || isNaN(parseFloat(data.unit_price)) || parseFloat(data.unit_price) <= 0) {
      errors.push('Valid unit price is required');
    }
    
    if (!data.payment_method || !['cash', 'mpesa', 'debt'].includes(data.payment_method)) {
      errors.push('Valid payment method is required (cash, mpesa, or debt)');
    }
    
    if (data.payment_method === 'debt') {
      if (!data.customer_name || data.customer_name.trim().length === 0) {
        errors.push('Customer name is required for debt payments');
      }
      
      if (!data.customer_phone || data.customer_phone.trim().length === 0) {
        errors.push('Customer phone is required for debt payments');
      }
    }
    
    // M-Pesa code is optional for M-Pesa payments (for record keeping only)
    // No customer details required for M-Pesa payments (same as cash)
    
    return errors;
  }
}

module.exports = Sale;
