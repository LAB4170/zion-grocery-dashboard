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
    this.id = data.id;
    this.saleId = data.saleId || data.sale_id;  
    this.customerName = data.customerName || data.customer_name;  
    this.customerPhone = data.customerPhone || data.customer_phone;  
    this.amount = parseFloat(data.amount);
    this.amountPaid = parseFloat(data.amountPaid || data.amount_paid || 0);  
    this.balance = parseFloat(data.balance || data.amount);
    this.status = data.status || 'pending';
    this.notes = data.notes || data.description || '';
    this.createdBy = data.createdBy || data.created_by;  
    this.createdAt = data.createdAt || data.created_at || new Date().toISOString();  
    this.updatedAt = data.updatedAt || data.updated_at;  
  }

  // Create new debt
  static async create(debtData) {
    const dbData = {
      id: debtData.id || uuidv4(),
      sale_id: debtData.saleId || debtData.sale_id,  
      customer_name: debtData.customerName || debtData.customer_name,  
      customer_phone: debtData.customerPhone || debtData.customer_phone,  
      amount: parseFloat(debtData.amount),
      amount_paid: parseFloat(debtData.amountPaid || debtData.amount_paid || 0),  
      balance: parseFloat(debtData.balance || debtData.amount),
      status: debtData.status || 'pending',
      notes: debtData.notes,
      created_by: debtData.createdBy || debtData.created_by,  
      created_at: debtData.createdAt || debtData.created_at || new Date().toISOString(),  
      updated_at: new Date().toISOString()
    };
    
    const debt = new Debt(dbData);
    debt.balance = debt.amount - debt.amount_paid;
    
    const [newDebt] = await getDatabase()('debts')
      .insert({
        id: debt.id,
        sale_id: debt.sale_id,
        customer_name: debt.customer_name,
        customer_phone: debt.customer_phone,
        amount: debt.amount,
        amount_paid: debt.amount_paid,
        balance: debt.balance,
        status: debt.status,
        notes: debt.notes,
        created_by: debt.created_by,
        created_at: debt.created_at,
        updated_at: debt.updated_at
      })
      .returning('*');
    
    return newDebt;
  }

  // Get all debts
  static async findAll(filters = {}) {
    let query = getDatabase()('debts').select('*');
    
    if (filters.status) {
      query = query.where('status', filters.status);
    }
    
    if (filters.customerName) {
      query = query.where('customer_name', 'ilike', `%${filters.customerName}%`);
    }
    
    if (filters.customerPhone) {
      query = query.where('customer_phone', 'ilike', `%${filters.customerPhone}%`);
    }
    
    if (filters.dateFrom) {
      query = query.where('created_at', '>=', filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query = query.where('created_at', '<=', filters.dateTo);
    }
    
    if (filters.overdue) {
      query = query.where('due_date', '<', new Date()).where('status', '!=', 'paid');
    }
    
    return await query.orderBy('created_at', 'desc');
  }

  // Get debt by ID
  static async findById(id) {
    const debt = await getDatabase()('debts').where('id', id).first();
    return debt;
  }

  // Update debt
  static async update(id, updateData) {
    updateData.updatedAt = new Date().toISOString();
    
    // Recalculate balance if amount_paid is updated
    if (updateData.amountPaid !== undefined) {
      const debt = await Debt.findById(id);
      updateData.balance = debt.amount - parseFloat(updateData.amountPaid);
      
      // Update status based on payment
      if (updateData.balance <= 0) {
        updateData.status = 'paid';
        updateData.balance = 0;
      } else if (updateData.amountPaid > 0) {
        updateData.status = 'partial';
      }
    }
    
    const dbUpdateData = {
      amount_paid: updateData.amountPaid,
      balance: updateData.balance,
      status: updateData.status,
      updated_at: updateData.updatedAt
    };
    
    const [updatedDebt] = await getDatabase()('debts')
      .where('id', id)
      .update(dbUpdateData)
      .returning('*');
    
    return updatedDebt;
  }

  // Delete debt
  static async delete(id) {
    return await getDatabase()('debts').where('id', id).del();
  }

  // Make payment
  static async makePayment(id, paymentAmount, paymentMethod = 'cash') {
    const trx = await getDatabase().transaction();
    
    try {
      const debt = await trx('debts').where('id', id).first();
      if (!debt) {
        throw new Error('Debt not found');
      }
      
      if (debt.status === 'paid') {
        throw new Error('Debt is already fully paid');
      }
      
      const newAmountPaid = parseFloat(debt.amount_paid) + parseFloat(paymentAmount);
      const newBalance = parseFloat(debt.amount) - newAmountPaid;
      
      if (newAmountPaid > parseFloat(debt.amount)) {
        throw new Error('Payment amount exceeds debt amount');
      }
      
      let newStatus = 'partial';
      if (newBalance <= 0) {
        newStatus = 'paid';
      }
      
      // Update debt
      const [updatedDebt] = await trx('debts')
        .where('id', id)
        .update({
          amount_paid: newAmountPaid,
          balance: Math.max(0, newBalance),
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .returning('*');
      
      // Record payment transaction
      await trx('debt_payments').insert({
        id: uuidv4(),
        debt_id: id,
        amount: paymentAmount,
        payment_method: paymentMethod,
        created_at: new Date().toISOString()
      });
      
      await trx.commit();
      return updatedDebt;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  // Get debt summary
  static async getSummary(filters = {}) {
    let query = getDatabase()('debts');
    
    if (filters.dateFrom) {
      query = query.where('created_at', '>=', filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query = query.where('created_at', '<=', filters.dateTo);
    }
    
    const summary = await query
      .select(
        getDatabase().raw('COUNT(*) as total_debts'),
        getDatabase().raw('SUM(amount) as total_amount'),
        getDatabase().raw('SUM(amount_paid) as total_paid'),
        getDatabase().raw('SUM(balance) as total_outstanding'),
        getDatabase().raw('COUNT(CASE WHEN status = ? THEN 1 END) as pending_count', ['pending']),
        getDatabase().raw('COUNT(CASE WHEN status = ? THEN 1 END) as paid_count', ['paid']),
        getDatabase().raw('COUNT(CASE WHEN status = ? THEN 1 END) as partial_count', ['partial'])
      )
      .first();
    
    return {
      total_debts: parseInt(summary.total_debts) || 0,
      total_amount: parseFloat(summary.total_amount) || 0,
      total_paid: parseFloat(summary.total_paid) || 0,
      total_outstanding: parseFloat(summary.total_outstanding) || 0,
      pending_count: parseInt(summary.pending_count) || 0,
      paid_count: parseInt(summary.paid_count) || 0,
      partial_count: parseInt(summary.partial_count) || 0
    };
  }

  // Get grouped debts by customer
  static async getGroupedByCustomer() {
    const groupedDebts = await getDatabase()('debts')
      .select('customer_name', 'customer_phone')
      .sum('amount as total_amount')
      .sum('amount_paid as total_paid')
      .sum('balance as total_outstanding')
      .count('* as debt_count')
      .groupBy('customer_name', 'customer_phone')
      .having('total_outstanding', '>', 0)
      .orderBy('total_outstanding', 'desc');
    
    return groupedDebts;
  }

  // Get overdue debts
  static async getOverdue() {
    const overdueDebts = await getDatabase()('debts')
      .where('due_date', '<', new Date())
      .where('status', '!=', 'paid')
      .orderBy('due_date', 'asc');
    
    return overdueDebts;
  }

  // Get payment history for a debt
  static async getPaymentHistory(debtId) {
    const payments = await getDatabase()('debt_payments')
      .where('debt_id', debtId)
      .orderBy('created_at', 'desc');
    
    return payments;
  }

  // Validate debt data
  static validate(data) {
    const errors = [];
    
    if (!data.customerName || data.customerName.trim().length === 0) {
      errors.push('Customer name is required');
    }
    
    if (!data.customerPhone || data.customerPhone.trim().length === 0) {
      errors.push('Customer phone is required');
    }
    
    if (!data.amount || isNaN(parseFloat(data.amount)) || parseFloat(data.amount) <= 0) {
      errors.push('Valid debt amount is required');
    }
    
    if (data.amountPaid && (isNaN(parseFloat(data.amountPaid)) || parseFloat(data.amountPaid) < 0)) {
      errors.push('Amount paid must be a valid positive number');
    }
    
    if (data.amountPaid && parseFloat(data.amountPaid) > parseFloat(data.amount)) {
      errors.push('Amount paid cannot exceed total debt amount');
    }
    
    return errors;
  }
}

module.exports = Debt;
