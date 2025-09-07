const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Debt {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.customer_name = data.customer_name;
    this.customer_phone = data.customer_phone;
    this.amount = parseFloat(data.amount);
    this.amount_paid = parseFloat(data.amount_paid || data.paid_amount) || 0;
    this.balance = parseFloat(data.balance || data.remaining_amount) || parseFloat(data.amount);
    this.status = data.status || 'pending'; // 'pending', 'partial', 'paid', 'overdue'
    this.due_date = data.due_date || null;
    this.notes = data.notes || data.description || '';
    this.sale_id = data.sale_id || null;
    this.created_by = data.created_by || data.user_id || 'system';
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  // Create new debt
  static async create(debtData) {
    const debt = new Debt(debtData);
    debt.balance = debt.amount - debt.amount_paid;
    
    const [newDebt] = await db('debts')
      .insert({
        id: debt.id,
        customer_name: debt.customer_name,
        customer_phone: debt.customer_phone,
        amount: debt.amount,
        amount_paid: debt.amount_paid,
        balance: debt.balance,
        status: debt.status,
        due_date: debt.due_date,
        notes: debt.notes,
        sale_id: debt.sale_id,
        created_by: debt.created_by,
        created_at: debt.created_at,
        updated_at: debt.updated_at
      })
      .returning('*');
    
    return newDebt;
  }

  // Get all debts
  static async findAll(filters = {}) {
    let query = db('debts').select('*');
    
    if (filters.status) {
      query = query.where('status', filters.status);
    }
    
    if (filters.customer_name) {
      query = query.where('customer_name', 'ilike', `%${filters.customer_name}%`);
    }
    
    if (filters.customer_phone) {
      query = query.where('customer_phone', 'ilike', `%${filters.customer_phone}%`);
    }
    
    if (filters.date_from) {
      query = query.where('created_at', '>=', filters.date_from);
    }
    
    if (filters.date_to) {
      query = query.where('created_at', '<=', filters.date_to);
    }
    
    if (filters.overdue) {
      query = query.where('due_date', '<', new Date()).where('status', '!=', 'paid');
    }
    
    return await query.orderBy('created_at', 'desc');
  }

  // Get debt by ID
  static async findById(id) {
    const debt = await db('debts').where('id', id).first();
    return debt;
  }

  // Update debt
  static async update(id, updateData) {
    updateData.updated_at = new Date();
    
    // Recalculate balance if amount_paid is updated
    if (updateData.amount_paid !== undefined) {
      const debt = await Debt.findById(id);
      updateData.balance = debt.amount - parseFloat(updateData.amount_paid);
      
      // Update status based on payment
      if (updateData.balance <= 0) {
        updateData.status = 'paid';
        updateData.balance = 0;
      } else if (updateData.amount_paid > 0) {
        updateData.status = 'partial';
      }
    }
    
    const [updatedDebt] = await db('debts')
      .where('id', id)
      .update(updateData)
      .returning('*');
    
    return updatedDebt;
  }

  // Delete debt
  static async delete(id) {
    return await db('debts').where('id', id).del();
  }

  // Make payment
  static async makePayment(id, paymentAmount, paymentMethod = 'cash') {
    const trx = await db.transaction();
    
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
          updated_at: new Date()
        })
        .returning('*');
      
      // Record payment transaction
      await trx('debt_payments').insert({
        id: uuidv4(),
        debt_id: id,
        amount: paymentAmount,
        payment_method: paymentMethod,
        created_at: new Date()
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
    let query = db('debts');
    
    if (filters.date_from) {
      query = query.where('created_at', '>=', filters.date_from);
    }
    
    if (filters.date_to) {
      query = query.where('created_at', '<=', filters.date_to);
    }
    
    const summary = await query
      .select(
        db.raw('COUNT(*) as total_debts'),
        db.raw('SUM(amount) as total_amount'),
        db.raw('SUM(amount_paid) as total_paid'),
        db.raw('SUM(balance) as total_outstanding'),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as pending_count', ['pending']),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as paid_count', ['paid']),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as partial_count', ['partial'])
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
    const groupedDebts = await db('debts')
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
    const overdueDebts = await db('debts')
      .where('due_date', '<', new Date())
      .where('status', '!=', 'paid')
      .orderBy('due_date', 'asc');
    
    return overdueDebts;
  }

  // Get payment history for a debt
  static async getPaymentHistory(debtId) {
    const payments = await db('debt_payments')
      .where('debt_id', debtId)
      .orderBy('created_at', 'desc');
    
    return payments;
  }

  // Validate debt data
  static validate(data) {
    const errors = [];
    
    if (!data.customer_name || data.customer_name.trim().length === 0) {
      errors.push('Customer name is required');
    }
    
    if (!data.customer_phone || data.customer_phone.trim().length === 0) {
      errors.push('Customer phone is required');
    }
    
    if (!data.amount || isNaN(parseFloat(data.amount)) || parseFloat(data.amount) <= 0) {
      errors.push('Valid debt amount is required');
    }
    
    if (data.amount_paid && (isNaN(parseFloat(data.amount_paid)) || parseFloat(data.amount_paid) < 0)) {
      errors.push('Amount paid must be a valid positive number');
    }
    
    if (data.amount_paid && parseFloat(data.amount_paid) > parseFloat(data.amount)) {
      errors.push('Amount paid cannot exceed total debt amount');
    }
    
    return errors;
  }
}

module.exports = Debt;
