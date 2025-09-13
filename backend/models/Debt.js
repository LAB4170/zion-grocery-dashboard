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

class Debt {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.saleId = data.saleId || data.sale_id || null;
    this.customerName = data.customerName || data.customer_name;
    this.customerPhone = data.customerPhone || data.customer_phone || null;
    this.amount = parseFloat(data.amount);
    this.status = data.status || 'pending';
    this.notes = data.notes || null;
    this.createdBy = data.createdBy || data.created_by || null;
    this.createdAt = data.createdAt || data.created_at || new Date().toISOString();
    this.updatedAt = data.updatedAt || data.updated_at;
  }

  // Create new debt
  static async create(debtData) {
    const debt = new Debt(debtData);
    
    const [newDebt] = await getDatabase()('debts')
      .insert({
        id: debt.id,
        sale_id: debt.saleId,
        customer_name: debt.customerName,
        customer_phone: debt.customerPhone,
        amount: debt.amount,
        status: debt.status,
        notes: debt.notes,
        created_by: debt.createdBy,
        created_at: debt.createdAt,
        updated_at: new Date().toISOString()
      })
      .returning('*');
    
    return newDebt;
  }

  // Get all debts with basic filters
  static async findAll(filters = {}) {
    let query = getDatabase()('debts').select('*');
    
    if (filters.status) {
      query = query.where('status', filters.status);
    }
    
    if (filters.customer_name) {
      query = query.where('customer_name', 'ilike', `%${filters.customer_name}%`);
    }
    
    if (filters.customer_phone) {
      query = query.where('customer_phone', 'ilike', `%${filters.customer_phone}%`);
    }
    
    const debts = await query.orderBy('created_at', 'desc');
    
    // Transform to frontend format (camelCase)
    return debts.map(debt => ({
      id: debt.id,
      saleId: debt.sale_id,
      customerName: debt.customer_name,
      customerPhone: debt.customer_phone,
      amount: debt.amount,
      status: debt.status,
      notes: debt.notes,
      createdBy: debt.created_by,
      createdAt: debt.created_at,
      updatedAt: debt.updated_at
    }));
  }

  // Get debt by ID
  static async findById(id) {
    const debt = await getDatabase()('debts').where('id', id).first();
    if (!debt) return null;
    
    // Transform to frontend format (camelCase)
    return {
      id: debt.id,
      saleId: debt.sale_id,
      customerName: debt.customer_name,
      customerPhone: debt.customer_phone,
      amount: debt.amount,
      status: debt.status,
      notes: debt.notes,
      createdBy: debt.created_by,
      createdAt: debt.created_at,
      updatedAt: debt.updated_at
    };
  }

  // Update debt
  static async update(id, updateData) {
    const db = getDatabase();
    const dbData = {
      customer_name: updateData.customerName,
      customer_phone: updateData.customerPhone,
      amount: parseFloat(updateData.amount),
      status: updateData.status,
      notes: updateData.notes,
      updated_at: new Date().toISOString()
    };
    
    const [updatedDebt] = await db('debts')
      .where('id', id)
      .update(dbData)
      .returning('*');
    
    return updatedDebt;
  }

  // Mark debt as paid (simple status change)
  static async markAsPaid(id) {
    const [paidDebt] = await getDatabase()('debts')
      .where('id', id)
      .update({
        status: 'paid',
        updated_at: new Date().toISOString()
      })
      .returning('*');
    
    return paidDebt;
  }

  // Delete debt
  static async delete(id) {
    return await getDatabase()('debts').where('id', id).del();
  }

  // Get basic debt summary for dashboard
  static async getSummary(filters = {}) {
    let query = getDatabase()('debts');
    
    if (filters.date_from) {
      query = query.where('created_at', '>=', filters.date_from);
    }
    
    if (filters.date_to) {
      query = query.where('created_at', '<=', filters.date_to);
    }
    
    const summary = await query
      .select(
        getDatabase().raw('COUNT(*) as total_debts'),
        getDatabase().raw('SUM(amount) as total_amount'),
        getDatabase().raw('SUM(CASE WHEN status = ? THEN amount ELSE 0 END) as pending_amount', ['pending']),
        getDatabase().raw('SUM(CASE WHEN status = ? THEN amount ELSE 0 END) as paid_amount', ['paid'])
      )
      .first();
    
    return {
      total_debts: parseInt(summary.total_debts) || 0,
      total_amount: parseFloat(summary.total_amount) || 0,
      pending_amount: parseFloat(summary.pending_amount) || 0,
      paid_amount: parseFloat(summary.paid_amount) || 0
    };
  }

  // Simple validation matching frontend
  static validate(data) {
    const errors = [];
    
    if (!data.customerName && !data.customer_name || (data.customerName || data.customer_name || '').trim().length === 0) {
      errors.push('Customer name is required');
    }
    
    if (!data.amount || isNaN(parseFloat(data.amount)) || parseFloat(data.amount) <= 0) {
      errors.push('Valid debt amount is required');
    }
    
    return errors;
  }
}

module.exports = Debt;
