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
    this.amountPaid = parseFloat(data.amountPaid || data.amount_paid || 0);
    this.balance = parseFloat(data.balance || (data.amount - (data.amountPaid || data.amount_paid || 0)));
    this.status = data.status || 'pending';
    this.dueDate = data.dueDate || data.due_date || null;
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
        amount_paid: debt.amountPaid,
        balance: debt.balance,
        status: debt.status,
        due_date: debt.dueDate,
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
      amountPaid: debt.amount_paid,
      balance: debt.balance,
      status: debt.status,
      dueDate: debt.due_date,
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
      amountPaid: debt.amount_paid,
      balance: debt.balance,
      status: debt.status,
      dueDate: debt.due_date,
      notes: debt.notes,
      createdBy: debt.created_by,
      createdAt: debt.created_at,
      updatedAt: debt.updated_at
    };
  }

  // Update debt
  static async update(id, updateData) {
    const db = getDatabase();
    const dbData = { updated_at: new Date().toISOString() };

    if (updateData.hasOwnProperty('customerName')) {
      dbData.customer_name = updateData.customerName;
    }
    if (updateData.hasOwnProperty('customerPhone')) {
      dbData.customer_phone = updateData.customerPhone;
    }
    if (updateData.hasOwnProperty('amount')) {
      const amt = parseFloat(updateData.amount);
      if (isNaN(amt) || amt <= 0) throw new Error('Valid debt amount is required');
      dbData.amount = amt;
    }
    if (updateData.hasOwnProperty('amountPaid') || updateData.hasOwnProperty('amount_paid')) {
      const paid = parseFloat(updateData.amountPaid ?? updateData.amount_paid);
      if (isNaN(paid) || paid < 0) throw new Error('Valid amount paid is required');
      dbData.amount_paid = paid;
    }
    if (updateData.hasOwnProperty('balance')) {
      const bal = parseFloat(updateData.balance);
      if (isNaN(bal) || bal < 0) throw new Error('Valid balance is required');
      dbData.balance = bal;
    }
    if (updateData.hasOwnProperty('status')) {
      dbData.status = updateData.status;
    }
    if (updateData.hasOwnProperty('dueDate') || updateData.hasOwnProperty('due_date')) {
      dbData.due_date = updateData.dueDate ?? updateData.due_date;
    }
    if (updateData.hasOwnProperty('notes')) {
      dbData.notes = updateData.notes;
    }
     
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

  // Group debts by customer (name + phone) with aggregates
  static async getGroupedByCustomer() {
    const dbx = getDatabase();
    const rows = await dbx('debts')
      .select('customer_name', 'customer_phone')
      .sum({ total_amount: 'amount' })
      .sum({ total_paid: 'amount_paid' })
      .sum({ total_balance: 'balance' })
      .count({ count: '*' })
      .groupBy('customer_name', 'customer_phone')
      .orderBy('customer_name', 'asc');

    return rows.map(r => ({
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      total_amount: parseFloat(r.total_amount) || 0,
      total_paid: parseFloat(r.total_paid) || 0,
      total_balance: parseFloat(r.total_balance) || 0,
      count: parseInt(r.count) || 0
    }));
  }

  // Get overdue debts (due_date < today and not paid)
  static async getOverdue() {
    const dbx = getDatabase();
    const today = new Date().toISOString().split('T')[0];
    const rows = await dbx('debts')
      .where('status', '!=', 'paid')
      .andWhereNotNull('due_date')
      .andWhere('due_date', '<', today)
      .orderBy('due_date', 'asc');

    return rows.map(debt => ({
      id: debt.id,
      saleId: debt.sale_id,
      customerName: debt.customer_name,
      customerPhone: debt.customer_phone,
      amount: parseFloat(debt.amount) || 0,
      amountPaid: parseFloat(debt.amount_paid) || 0,
      balance: parseFloat(debt.balance) || 0,
      status: debt.status,
      dueDate: debt.due_date,
      notes: debt.notes,
      createdBy: debt.created_by,
      createdAt: debt.created_at,
      updatedAt: debt.updated_at
    }));
  }

  // Get payment history for a debt
  static async getPaymentHistory(debtId) {
    const dbx = getDatabase();
    const rows = await dbx('debt_payments')
      .where('debt_id', debtId)
      .orderBy('created_at', 'desc');

    return rows.map(p => ({
      id: p.id,
      debtId: p.debt_id,
      amount: parseFloat(p.amount) || 0,
      payment_method: p.payment_method,
      mpesa_code: p.mpesa_code,
      notes: p.notes,
      created_by: p.created_by,
      created_at: p.created_at,
      updated_at: p.updated_at
    }));
  }

  // Make a payment towards a debt (transactional)
  static async makePayment(debtId, amount, payment_method) {
    const dbx = getDatabase();
    const trx = await dbx.transaction();
    try {
      const amt = parseFloat(amount);
      if (!amt || isNaN(amt) || amt <= 0) {
        throw new Error('Valid payment amount is required');
      }

      // Lock the debt row
      const debt = await trx('debts').where('id', debtId).forUpdate().first();
      if (!debt) throw new Error('Debt not found');

      // Insert payment
      const [payment] = await trx('debt_payments')
        .insert({
          id: uuidv4(),
          debt_id: debtId,
          amount: amt,
          payment_method,
          created_by: debt.created_by || 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .returning('*');

      // Update debt totals
      const newAmountPaid = parseFloat(debt.amount_paid || 0) + amt;
      const newBalance = Math.max(parseFloat(debt.amount || 0) - newAmountPaid, 0);
      const newStatus = newBalance <= 0 ? 'paid' : 'pending';

      const [updatedDebt] = await trx('debts')
        .where('id', debtId)
        .update({
          amount_paid: newAmountPaid,
          balance: newBalance,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .returning('*');

      await trx.commit();

      return {
        payment,
        debt: updatedDebt
      };
    } catch (err) {
      await trx.rollback();
      throw err;
    }
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

  // Partial validation for updates
  static validateUpdate(data) {
    const errors = [];

    if (data.hasOwnProperty('customerName') || data.hasOwnProperty('customer_name')) {
      const name = data.customerName ?? data.customer_name;
      if (!name || (name || '').trim().length === 0) {
        errors.push('Customer name cannot be empty');
      }
    }

    if (data.hasOwnProperty('amount')) {
      const amt = parseFloat(data.amount);
      if (isNaN(amt) || amt <= 0) {
        errors.push('Valid debt amount is required');
      }
    }

    if (data.hasOwnProperty('amountPaid') || data.hasOwnProperty('amount_paid')) {
      const paid = parseFloat(data.amountPaid ?? data.amount_paid);
      if (isNaN(paid) || paid < 0) {
        errors.push('Valid amount paid is required');
      }
    }

    if (data.hasOwnProperty('balance')) {
      const bal = parseFloat(data.balance);
      if (isNaN(bal) || bal < 0) {
        errors.push('Valid balance is required');
      }
    }

    return errors;
  }
}

module.exports = Debt;
