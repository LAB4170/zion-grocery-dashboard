const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Expense {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.description = data.description;
    this.amount = parseFloat(data.amount);
    this.category = data.category;
    this.status = data.status || 'pending';
    this.expense_date = data.expense_date || data.date;
    this.receipt_number = data.receipt_number || null;
    this.notes = data.notes || '';
    this.created_by = data.created_by || data.user_id || 'system';
    this.approved_by = data.approved_by || null;
    this.approved_at = data.approved_at || null;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  // Create new expense
  static async create(expenseData) {
    const dbData = {
      id: expenseData.id || uuidv4(),
      description: expenseData.description,
      amount: parseFloat(expenseData.amount),
      category: expenseData.category,
      status: expenseData.status || 'pending',
      expense_date: expenseData.expense_date || expenseData.date || new Date(),
      receipt_number: expenseData.receipt_number || null,
      notes: expenseData.notes || '',
      created_by: expenseData.created_by || expenseData.user_id || 'system',
      approved_by: expenseData.approved_by || null,
      approved_at: expenseData.approved_at || null,
      created_at: expenseData.createdAt || expenseData.created_at || new Date(),
      updated_at: expenseData.updatedAt || expenseData.updated_at || new Date()
    };

    console.log('Creating expense with data:', dbData);
    
    const [newExpense] = await db('expenses')
      .insert(dbData)
      .returning('*');
    
    console.log('Expense created successfully:', newExpense);
    return newExpense;
  }

  // Get all expenses
  static async findAll(filters = {}) {
    let query = db('expenses').select('*');
    
    if (filters.category) {
      query = query.where('category', filters.category);
    }
    
    if (filters.status) {
      query = query.where('status', filters.status);
    }
    
    if (filters.date_from) {
      query = query.where('created_at', '>=', filters.date_from);
    }
    
    if (filters.date_to) {
      query = query.where('created_at', '<=', filters.date_to);
    }
    
    if (filters.search) {
      query = query.where(function() {
        this.where('description', 'ilike', `%${filters.search}%`)
            .orWhere('notes', 'ilike', `%${filters.search}%`)
            .orWhere('receipt_number', 'ilike', `%${filters.search}%`);
      });
    }
    
    return await query.orderBy('created_at', 'desc');
  }

  // Get expense by ID
  static async findById(id) {
    const expense = await db('expenses').where('id', id).first();
    return expense;
  }

  // Update expense
  static async update(id, updateData) {
    updateData.updated_at = new Date();
    
    const [updatedExpense] = await db('expenses')
      .where('id', id)
      .update(updateData)
      .returning('*');
    
    return updatedExpense;
  }

  // Delete expense
  static async delete(id) {
    return await db('expenses').where('id', id).del();
  }

  // Approve expense
  static async approve(id, approvedBy) {
    const [approvedExpense] = await db('expenses')
      .where('id', id)
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');
    
    return approvedExpense;
  }

  // Reject expense
  static async reject(id, rejectedBy) {
    const [rejectedExpense] = await db('expenses')
      .where('id', id)
      .update({
        status: 'rejected',
        approved_by: rejectedBy,
        approved_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');
    
    return rejectedExpense;
  }

  // Get expense summary
  static async getSummary(filters = {}) {
    let query = db('expenses');
    
    if (filters.date_from) {
      query = query.where('created_at', '>=', filters.date_from);
    }
    
    if (filters.date_to) {
      query = query.where('created_at', '<=', filters.date_to);
    }
    
    const summary = await query
      .select(
        db.raw('COUNT(*) as total_expenses'),
        db.raw('SUM(amount) as total_amount'),
        db.raw('SUM(CASE WHEN status = ? THEN amount ELSE 0 END) as approved_amount', ['approved']),
        db.raw('SUM(CASE WHEN status = ? THEN amount ELSE 0 END) as pending_amount', ['pending']),
        db.raw('AVG(amount) as average_expense')
      )
      .first();
    
    return {
      total_expenses: parseInt(summary.total_expenses) || 0,
      total_amount: parseFloat(summary.total_amount) || 0,
      approved_amount: parseFloat(summary.approved_amount) || 0,
      pending_amount: parseFloat(summary.pending_amount) || 0,
      average_expense: parseFloat(summary.average_expense) || 0
    };
  }

  // Get expenses by category
  static async getByCategory() {
    const categories = await db('expenses')
      .select('category')
      .sum('amount as total_amount')
      .count('* as count')
      .groupBy('category')
      .orderBy('total_amount', 'desc');
    
    return categories;
  }

  // Get monthly expenses
  static async getMonthlyExpenses(months = 12) {
    const expenses = await db('expenses')
      .select(
        db.raw('DATE_TRUNC(\'month\', created_at) as month'),
        db.raw('SUM(amount) as total_amount'),
        db.raw('COUNT(*) as count')
      )
      .where('created_at', '>=', db.raw(`NOW() - INTERVAL '${months} months'`))
      .groupBy(db.raw('DATE_TRUNC(\'month\', created_at)'))
      .orderBy('month', 'desc');
    
    return expenses;
  }

  // Get expense categories
  static async getCategories() {
    const categories = await db('expenses')
      .distinct('category')
      .orderBy('category', 'asc');
    
    return categories.map(cat => cat.category);
  }

  // Validate expense data
  static validate(data) {
    const errors = [];
    
    if (!data.description || data.description.trim().length === 0) {
      errors.push('Expense description is required');
    }
    
    if (!data.amount || isNaN(parseFloat(data.amount)) || parseFloat(data.amount) <= 0) {
      errors.push('Valid expense amount is required');
    }
    
    if (!data.category || data.category.trim().length === 0) {
      errors.push('Expense category is required');
    }
    
    return errors;
  }
}

module.exports = Expense;
