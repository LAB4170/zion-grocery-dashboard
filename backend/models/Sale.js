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

class Sale {
  constructor(data) {
    this.id = data.id; 
    this.productId = data.productId || data.product_id;
    this.productName = data.productName || data.product_name;
    this.quantity = parseInt(data.quantity);
    this.unitPrice = parseFloat(data.unitPrice || data.unit_price);
    this.total = parseFloat(data.total);
    this.paymentMethod = data.paymentMethod || data.payment_method;
    this.customerName = data.customerName || data.customer_name || null;
    this.customerPhone = data.customerPhone || data.customer_phone || null;
    this.status = data.status || 'completed';
    this.mpesaCode = data.mpesaCode || data.mpesa_code || null;
    this.notes = data.notes || null;
    this.date = data.date || new Date().toISOString().split('T')[0];
    this.createdBy = data.createdBy || data.created_by || null;
    this.createdAt = data.createdAt || data.created_at || new Date().toISOString();
    this.updatedAt = data.updatedAt || data.updated_at;
  }

  // Create new sale
  static async create(saleData) {
    const sale = new Sale(saleData);
    
    // Generate UUID if not provided
    if (!sale.id) {
      sale.id = uuidv4();
    }
    
    // Start transaction
    const trx = await getDatabase().transaction();
    
    try {
      // Check product stock
      const product = await trx('products').where('id', sale.productId).first();
      if (!product) {
        throw new Error('Product not found');
      }
      
      if (product.stock_quantity < sale.quantity) {
        throw new Error('Insufficient stock');
      }
      
      // Create sale record
      const [newSale] = await trx('sales')
        .insert({
          id: sale.id,
          product_id: sale.productId,
          product_name: sale.productName,
          quantity: sale.quantity,
          unit_price: sale.unitPrice,
          total: sale.total,
          payment_method: sale.paymentMethod,
          customer_name: sale.customerName,
          customer_phone: sale.customerPhone,
          status: sale.status,
          mpesa_code: sale.mpesaCode,
          notes: sale.notes,
          date: sale.date,
          created_by: sale.createdBy,
          created_at: sale.createdAt,
          updated_at: new Date().toISOString()
        })
        .returning('*');
      
      // Update product stock
      await trx('products')
        .where('id', sale.productId)
        .decrement('stock_quantity', sale.quantity)
        .update('updated_at', new Date().toISOString());
      
      // If payment method is debt, create simple debt record
      if (sale.paymentMethod === 'debt') {
        await trx('debts').insert({
          id: uuidv4(),
          sale_id: newSale.id,
          customer_name: sale.customerName,
          customer_phone: sale.customerPhone,
          amount: sale.total,
          status: 'pending',
          notes: `Sale: ${sale.productName} (${sale.quantity} units)`,
          created_by: sale.createdBy,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      
      await trx.commit();
      return newSale;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  // Get all sales with basic filters
  static async findAll(filters = {}) {
    let query = getDatabase()('sales').select('*');
    
    if (filters.date_from) {
      query = query.where('created_at', '>=', filters.date_from);
    }
    
    if (filters.date_to) {
      // Make date_to inclusive for whole day if only a YYYY-MM-DD is provided
      const to = filters.date_to.length === 10 ? filters.date_to + 'T23:59:59.999Z' : filters.date_to;
      query = query.where('created_at', '<=', to);
    }
    
    if (filters.payment_method) {
      query = query.where('payment_method', filters.payment_method);
    }
    
    if (filters.customer_name) {
      query = query.where('customer_name', 'ilike', `%${filters.customer_name}%`);
    }
    
    const sales = await query.orderBy('created_at', 'desc');
    
    // Transform to frontend format (camelCase)
    return sales.map(sale => {
      const createdAt = sale.created_at;
      const createdAtISO = (createdAt && typeof createdAt !== 'string')
        ? createdAt.toISOString()
        : (createdAt || null);
      const dateStr = sale.date || (createdAtISO ? createdAtISO.split('T')[0] : new Date().toISOString().split('T')[0]);
      return {
        id: sale.id,
        productId: sale.product_id,
        productName: sale.product_name,
        quantity: sale.quantity,
        unitPrice: sale.unit_price,
        total: sale.total,
        paymentMethod: sale.payment_method,
        customerName: sale.customer_name,
        customerPhone: sale.customer_phone,
        status: sale.status,
        mpesaCode: sale.mpesa_code,
        notes: sale.notes,
        date: dateStr,
        createdBy: sale.created_by,
        createdAt: createdAtISO,
        updatedAt: sale.updated_at
      };
    });
  }

  // New: Server-side pagination with filters and sorting
  static async findPaginated({
    date_from,
    date_to,
    payment_method,
    status,
    customer_name
  } = {}, {
    page = 1,
    perPage = 25,
    sortBy = 'created_at',
    sortDir = 'desc'
  } = {}) {
    const dbx = getDatabase();

    // Base query with filters
    let base = dbx('sales');

    if (date_from) base = base.where('created_at', '>=', date_from);
    if (date_to) {
      const to = date_to.length === 10 ? date_to + 'T23:59:59.999Z' : date_to;
      base = base.where('created_at', '<=', to);
    }
    if (payment_method) base = base.where('payment_method', payment_method);
    if (status) base = base.where('status', status);
    if (customer_name) base = base.where('customer_name', 'ilike', `%${customer_name}%`);

    // Total count (before pagination)
    const [{ count }] = await base.clone().count('* as count');
    const total = parseInt(count) || 0;

    // Clamp perPage and page
    const safePerPage = Math.min(Math.max(parseInt(perPage) || 25, 1), 1000);
    const safePage = Math.max(parseInt(page) || 1, 1);
    const offset = (safePage - 1) * safePerPage;

    // Fetch page items
    const rows = await base
      .clone()
      .select('*')
      .orderBy(sortBy, sortDir.toLowerCase() === 'asc' ? 'asc' : 'desc')
      .limit(safePerPage)
      .offset(offset);

    const items = rows.map(sale => {
      const createdAt = sale.created_at;
      const createdAtISO = (createdAt && typeof createdAt !== 'string')
        ? createdAt.toISOString()
        : (createdAt || null);
      const dateStr = sale.date || (createdAtISO ? createdAtISO.split('T')[0] : new Date().toISOString().split('T')[0]);
      return {
        id: sale.id,
        productId: sale.product_id,
        productName: sale.product_name,
        quantity: sale.quantity,
        unitPrice: sale.unit_price,
        total: sale.total,
        paymentMethod: sale.payment_method,
        customerName: sale.customer_name,
        customerPhone: sale.customer_phone,
        status: sale.status,
        mpesaCode: sale.mpesa_code,
        notes: sale.notes,
        date: dateStr,
        createdBy: sale.created_by,
        createdAt: createdAtISO,
        updatedAt: sale.updated_at
      };
    });

    return {
      items,
      total,
      page: safePage,
      perPage: safePerPage,
      totalPages: Math.max(Math.ceil(total / safePerPage), 1)
    };
  }

  // Get sale by ID
  static async findById(id) {
    const sale = await getDatabase()('sales').where('id', id).first();
    if (!sale) return null;
    
    // Transform to frontend format (camelCase)
    const createdAt = sale.created_at;
    const createdAtISO = (createdAt && typeof createdAt !== 'string')
      ? createdAt.toISOString()
      : (createdAt || null);
    const dateStr = sale.date || (createdAtISO ? createdAtISO.split('T')[0] : new Date().toISOString().split('T')[0]);
    return {
      id: sale.id,
      productId: sale.product_id,
      productName: sale.product_name,
      quantity: sale.quantity,
      unitPrice: sale.unit_price,
      total: sale.total,
      paymentMethod: sale.payment_method,
      customerName: sale.customer_name,
      customerPhone: sale.customer_phone,
      status: sale.status,
      mpesaCode: sale.mpesa_code,
      notes: sale.notes,
      date: dateStr,
      createdBy: sale.created_by,
      createdAt: createdAtISO,
      updatedAt: sale.updated_at
    };
  }

  // Update sale (transactional with stock and debt consistency)
  static async update(id, updateData) {
    const dbx = getDatabase();
    const trx = await dbx.transaction();

    try {
      // Load existing sale
      const existing = await trx('sales').where('id', id).first();
      if (!existing) {
        throw new Error('Sale not found');
      }

      // Normalize incoming values
      const nextProductId = updateData.productId;
      const nextQuantity = parseInt(updateData.quantity);
      const nextUnitPrice = parseFloat(updateData.unitPrice);
      const nextTotal = parseFloat(updateData.total);
      const nextPaymentMethod = updateData.paymentMethod;
      const nextStatus = updateData.status;
      const nextDate = updateData.date;
      const nextNotes = updateData.notes;
      const nextMpesaCode = updateData.mpesaCode;
      const nextCustomerName = updateData.customerName || null;
      const nextCustomerPhone = updateData.customerPhone || null;
      const providedCreatedAt = updateData.createdAt || updateData.created_at || null;

      // Compute stock adjustments if product or quantity changed
      const productChanged = nextProductId && nextProductId !== existing.product_id;
      const quantityChanged = typeof nextQuantity === 'number' && nextQuantity !== existing.quantity;

      if (productChanged || quantityChanged) {
        // If product changed, restore stock to old product fully
        if (productChanged) {
          await trx('products')
            .where('id', existing.product_id)
            .increment('stock_quantity', existing.quantity)
            .update('updated_at', new Date().toISOString());

          // Deduct from new product with availability check
          const newProduct = await trx('products').where('id', nextProductId).first();
          if (!newProduct) throw new Error('New product not found');
          if (newProduct.stock_quantity < nextQuantity) throw new Error('Insufficient stock for new product');
          await trx('products')
            .where('id', nextProductId)
            .decrement('stock_quantity', nextQuantity)
            .update('updated_at', new Date().toISOString());
        } else if (quantityChanged) {
          // Same product, adjust by difference
          const diff = nextQuantity - existing.quantity; // positive means need to deduct more
          if (diff !== 0) {
            if (diff > 0) {
              // Need more stock
              const product = await trx('products').where('id', existing.product_id).first();
              if (!product) throw new Error('Product not found');
              if (product.stock_quantity < diff) throw new Error('Insufficient stock for quantity increase');
              await trx('products')
                .where('id', existing.product_id)
                .decrement('stock_quantity', diff)
                .update('updated_at', new Date().toISOString());
            } else {
              // Return stock
              await trx('products')
                .where('id', existing.product_id)
                .increment('stock_quantity', Math.abs(diff))
                .update('updated_at', new Date().toISOString());
            }
          }
        }
      }

      // Prepare sale DB data
      const dbData = {
        product_id: nextProductId ?? existing.product_id,
        product_name: updateData.productName ?? existing.product_name,
        quantity: nextQuantity ?? existing.quantity,
        unit_price: isNaN(nextUnitPrice) ? existing.unit_price : nextUnitPrice,
        total: isNaN(nextTotal) ? existing.total : nextTotal,
        payment_method: nextPaymentMethod ?? existing.payment_method,
        customer_name: nextCustomerName,
        customer_phone: nextCustomerPhone,
        status: nextStatus ?? existing.status,
        mpesa_code: nextMpesaCode ?? existing.mpesa_code,
        notes: nextNotes ?? existing.notes,
        date: nextDate ?? existing.date,
        updated_at: new Date().toISOString()
      };

      if (providedCreatedAt) {
        dbData.created_at = providedCreatedAt;
      }

      // Update sale
      const [updatedSale] = await trx('sales')
        .where('id', id)
        .update(dbData)
        .returning('*');

      // Keep linked debt consistent
      const hadDebt = await trx('debts').where('sale_id', id).first();
      const isDebtNow = (dbData.payment_method === 'debt');

      if (hadDebt && !isDebtNow) {
        // Payment changed from debt to non-debt → remove debt
        await trx('debts').where('sale_id', id).del();
      } else if (!hadDebt && isDebtNow) {
        // Payment changed to debt → create debt
        await trx('debts').insert({
          id: uuidv4(),
          sale_id: id,
          customer_name: dbData.customer_name,
          customer_phone: dbData.customer_phone,
          amount: dbData.total,
          status: 'pending',
          notes: `Sale: ${dbData.product_name} (${dbData.quantity} units)`,
          created_by: updatedSale.created_by || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } else if (hadDebt && isDebtNow) {
        // Still a debt sale → update basic fields and amount
        await trx('debts')
          .where('sale_id', id)
          .update({
            customer_name: dbData.customer_name,
            customer_phone: dbData.customer_phone,
            amount: dbData.total,
            notes: `Sale: ${dbData.product_name} (${dbData.quantity} units)`,
            updated_at: new Date().toISOString()
          });
      }

      await trx.commit();
      return updatedSale;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  // Delete sale
  static async delete(id) {
    const dbx = getDatabase();
    const trx = await dbx.transaction();

    try {
      // 1) Lock the sale row first to serialize concurrent deletes
      const sale = await trx('sales')
        .where('id', id)
        .forUpdate()
        .first();

      if (!sale) {
        // Already deleted (or never existed) → nothing to restore
        await trx.rollback();
        throw new Error('Sale not found');
      }

      // 2) Lock the product row and restore stock atomically if product exists
      const productRow = await trx('products')
        .where('id', sale.product_id)
        .forUpdate()
        .first();

      if (productRow) {
        await trx('products')
          .where('id', sale.product_id)
          .increment('stock_quantity', sale.quantity)
          .update('updated_at', new Date().toISOString());
      }

      // 3) Remove any associated debts for this sale
      await trx('debts').where('sale_id', id).del();

      // 4) Delete the sale AFTER stock has been restored
      await trx('sales').where('id', id).del();

      // 5) Read back product for response (may be null if product missing)
      const updatedProduct = productRow
        ? await trx('products').where('id', sale.product_id).first()
        : null;

      await trx.commit();
      return { product: updatedProduct };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  // Get basic sales summary for dashboard
  static async getSummary(filters = {}) {
    let query = getDatabase()('sales');
    
    if (filters.date_from) {
      query = query.where('created_at', '>=', filters.date_from);
    }
    
    if (filters.date_to) {
      query = query.where('created_at', '<=', filters.date_to);
    }
    
    const summary = await query
      .select(
        getDatabase().raw('COUNT(*) as total_sales'),
        getDatabase().raw('SUM(total) as total_revenue'),
        getDatabase().raw('SUM(CASE WHEN payment_method = ? THEN total ELSE 0 END) as cash_sales', ['cash']),
        getDatabase().raw('SUM(CASE WHEN payment_method = ? THEN total ELSE 0 END) as mpesa_sales', ['mpesa']),
        getDatabase().raw('SUM(CASE WHEN payment_method = ? THEN total ELSE 0 END) as debt_sales', ['debt'])
      )
      .first();
    
    return {
      total_sales: parseInt(summary.total_sales) || 0,
      total_revenue: parseFloat(summary.total_revenue) || 0,
      cash_sales: parseFloat(summary.cash_sales) || 0,
      mpesa_sales: parseFloat(summary.mpesa_sales) || 0,
      debt_sales: parseFloat(summary.debt_sales) || 0
    };
  }

  // Simple validation matching frontend
  static validate(data) {
    const errors = [];
    
    if (!data.productId && !data.product_id) {
      errors.push('Product ID is required');
    }
    
    if (!data.quantity || isNaN(parseInt(data.quantity)) || parseInt(data.quantity) <= 0) {
      errors.push('Valid quantity is required');
    }
    
    if (!data.unitPrice && !data.unit_price || isNaN(parseFloat(data.unitPrice || data.unit_price)) || parseFloat(data.unitPrice || data.unit_price) <= 0) {
      errors.push('Valid unit price is required');
    }
    
    if (!data.paymentMethod && !data.payment_method || !['cash', 'mpesa', 'debt'].includes(data.paymentMethod || data.payment_method)) {
      errors.push('Valid payment method is required (cash, mpesa, or debt)');
    }
    
    if ((data.paymentMethod === 'debt' || data.payment_method === 'debt')) {
      if (!data.customerName && !data.customer_name || (data.customerName || data.customer_name || '').trim().length === 0) {
        errors.push('Customer name is required for debt payments');
      }
      
      if (!data.customerPhone && !data.customer_phone || (data.customerPhone || data.customer_phone || '').trim().length === 0) {
        errors.push('Customer phone is required for debt payments');
      }
    }
    
    return errors;
  }
}

module.exports = Sale;
