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

class Expense {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.description = data.description;
    this.amount = parseFloat(data.amount);
    this.category = data.category;
    this.createdBy = data.createdBy || data.created_by || 'system';
    this.createdAt = data.createdAt || data.created_at || new Date().toISOString();
    this.updatedAt = data.updatedAt || data.updated_at;
  }

  // Create new expense
  static async create(expenseData) {
    const expense = new Expense(expenseData);
    
    const [newExpense] = await getDatabase()('expenses')
      .insert({
        id: expense.id,
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        created_by: expense.createdBy,
        created_at: expense.createdAt,
        updated_at: new Date().toISOString()
      })
      .returning('*');
    
    return newExpense;
  }

  // Get all expenses with basic filters
  static async findAll(filters = {}) {
    let query = getDatabase()('expenses').select('*');
    
    if (filters.category) {
      query = query.where('category', filters.category);
    }
    
    if (filters.date_from) {
      query = query.where('created_at', '>=', filters.date_from);
    }
    
    if (filters.date_to) {
      query = query.where('created_at', '<=', filters.date_to);
    }
    
    if (filters.search) {
      query = query.where('description', 'ilike', `%${filters.search}%`);
    }
    
    const expenses = await query.orderBy('created_at', 'desc');
    
    // Transform to frontend format (camelCase)
    return expenses.map(expense => ({
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      createdBy: expense.created_by,
      createdAt: expense.created_at,
      updatedAt: expense.updated_at
    }));
  }

  // Get expense by ID
  static async findById(id) {
    const expense = await getDatabase()('expenses').where('id', id).first();
    if (!expense) return null;
    
    // Transform to frontend format (camelCase)
    return {
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      createdBy: expense.created_by,
      createdAt: expense.created_at,
      updatedAt: expense.updated_at
    };
  }

  // Update expense
  static async update(id, updateData) {
    const db = getDatabase();
    const dbData = {
      description: updateData.description,
      amount: parseFloat(updateData.amount),
      category: updateData.category,
      updated_at: new Date().toISOString()
    };
    
    const [updatedExpense] = await db('expenses')
      .where('id', id)
      .update(dbData)
      .returning('*');
    
    return updatedExpense;
  }

  // Delete expense
  static async delete(id) {
    return await getDatabase()('expenses').where('id', id).del();
  }

  // Get basic expense summary for dashboard
  static async getSummary(filters = {}) {
    let query = getDatabase()('expenses');
    
    if (filters.date_from) {
      query = query.where('created_at', '>=', filters.date_from);
    }
    
    if (filters.date_to) {
      query = query.where('created_at', '<=', filters.date_to);
    }
    
    const summary = await query
      .select(
        getDatabase().raw('COUNT(*) as total_expenses'),
        getDatabase().raw('SUM(amount) as total_amount')
      )
      .first();
    
    return {
      total_expenses: parseInt(summary.total_expenses) || 0,
      total_amount: parseFloat(summary.total_amount) || 0
    };
  }

  // Get expenses by category
  static async getByCategory() {
    const categories = await getDatabase()('expenses')
      .select('category')
      .sum('amount as total_amount')
      .count('* as count')
      .groupBy('category')
      .orderBy('total_amount', 'desc');
    
    return categories;
  }

  // Simple validation matching frontend
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
