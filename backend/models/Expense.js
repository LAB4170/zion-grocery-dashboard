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
    // Optional fields (may not exist in schema yet)
    this.status = data.status || 'pending';
    this.approvedBy = data.approvedBy || data.approved_by || null;
    this.approvedAt = data.approvedAt || data.approved_at || null;
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
      updatedAt: expense.updated_at,
      status: expense.status,
      approvedBy: expense.approved_by,
      approvedAt: expense.approved_at
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
      updatedAt: expense.updated_at,
      status: expense.status,
      approvedBy: expense.approved_by,
      approvedAt: expense.approved_at
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

  // Approve an expense (requires status/approved_by/approved_at columns)
  static async approve(id, user = 'system') {
    const dbx = getDatabase();
    // Check required columns exist to avoid runtime errors
    const hasStatus = await dbx.schema.hasColumn('expenses', 'status');
    const hasApprovedBy = await dbx.schema.hasColumn('expenses', 'approved_by');
    const hasApprovedAt = await dbx.schema.hasColumn('expenses', 'approved_at');
    if (!hasStatus || !hasApprovedBy || !hasApprovedAt) {
      throw new Error("Expenses approval fields are missing. Add columns: status (text), approved_by (text), approved_at (timestamp). Create a migration (e.g., 1001_add_expense_status.js) and run it.");
    }

    const [updated] = await dbx('expenses')
      .where('id', id)
      .update({
        status: 'approved',
        approved_by: user,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .returning('*');

    return updated;
  }

  // Reject an expense (requires status/approved_by/approved_at columns)
  static async reject(id, user = 'system') {
    const dbx = getDatabase();
    const hasStatus = await dbx.schema.hasColumn('expenses', 'status');
    const hasApprovedBy = await dbx.schema.hasColumn('expenses', 'approved_by');
    const hasApprovedAt = await dbx.schema.hasColumn('expenses', 'approved_at');
    if (!hasStatus || !hasApprovedBy || !hasApprovedAt) {
      throw new Error("Expenses approval fields are missing. Add columns: status (text), approved_by (text), approved_at (timestamp). Create a migration (e.g., 1001_add_expense_status.js) and run it.");
    }

    const [updated] = await dbx('expenses')
      .where('id', id)
      .update({
        status: 'rejected',
        approved_by: user,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .returning('*');

    return updated;
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

  // Get monthly aggregates for the last N months, grouped by month (YYYY-MM)
  static async getMonthlyExpenses(months = 12) {
    const dbx = getDatabase();
    const m = Math.max(parseInt(months) || 12, 1);

    // Compute start month in YYYY-MM-01
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (m - 1), 1);
    const startISO = start.toISOString().split('T')[0];

    // Use date_trunc for monthly buckets
    const rows = await dbx('expenses')
      .where('created_at', '>=', startISO)
      .select(dbx.raw("to_char(date_trunc('month', created_at), 'YYYY-MM') as month"))
      .sum({ total_amount: 'amount' })
      .count({ total_expenses: '*' })
      .groupBy('month')
      .orderBy('month', 'asc');

    return rows.map(r => ({
      month: r.month,
      total_expenses: parseInt(r.total_expenses) || 0,
      total_amount: parseFloat(r.total_amount) || 0
    }));
  }

  // Get weekly expenses for the current week (Monday–Sunday), zero-filled
  static async getWeeklyExpenses() {
    const dbx = getDatabase();

    // Compute Monday of current week (local server time)
    const today = new Date();
    const day = today.getDay(); // 0=Sun,1=Mon
    const diffToMonday = (day === 0) ? -6 : (1 - day);
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split('T')[0];
    });

    // Aggregate by DATE(created_at)
    const rows = await dbx('expenses')
      .where('created_at', '>=', days[0])
      .andWhere('created_at', '<=', days[6] + 'T23:59:59.999Z')
      .select(dbx.raw("to_char(created_at::date, 'YYYY-MM-DD') as date"))
      .sum({ total_amount: 'amount' })
      .count({ total_expenses: '*' })
      .groupBy('date');

    const byDate = new Map();
    for (const r of rows) {
      byDate.set(r.date, {
        total_expenses: parseInt(r.total_expenses) || 0,
        total_amount: parseFloat(r.total_amount) || 0
      });
    }

    const result = days.map(d => ({
      date: d,
      total_expenses: byDate.get(d)?.total_expenses || 0,
      total_amount: byDate.get(d)?.total_amount || 0
    }));

    return {
      week: { start: days[0], end: days[6] },
      days: result
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
