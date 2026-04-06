const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const { expenseValidationRules, validate } = require('../middleware/validation');

// GET /api/expenses - Get all expenses
router.get('/', catchAsync(async (req, res) => {
  const filters = {
    category: req.query.category,
    status: req.query.status,
    date_from: req.query.date_from,
    date_to: req.query.date_to,
    search: req.query.search
  };

  const expenses = await Expense.findAll(filters, req.businessId);
  
  res.json({
    success: true,
    data: expenses,
    count: expenses.length
  });
}));

// GET /api/expenses/summary - Get expenses summary
router.get('/summary', catchAsync(async (req, res) => {
  const filters = {
    date_from: req.query.date_from,
    date_to: req.query.date_to
  };

  const summary = await Expense.getSummary(filters, req.businessId);
  
  res.json({
    success: true,
    data: summary
  });
}));

// GET /api/expenses/categories - Get expenses by category
router.get('/categories', catchAsync(async (req, res) => {
  if (typeof Expense.getByCategory !== 'function') {
    return res.status(501).json({ success: false, message: 'Expenses categories endpoint not implemented' });
  }
  const categories = await Expense.getByCategory(req.businessId);
  
  res.json({
    success: true,
    data: categories
  });
}));

// GET /api/expenses/monthly - Get monthly expenses
router.get('/monthly', catchAsync(async (req, res) => {
  const months = parseInt(req.query.months) || 12;
  if (typeof Expense.getMonthlyExpenses !== 'function') {
    return res.status(501).json({ success: false, message: 'Expenses monthly endpoint not implemented' });
  }
  const monthlyExpenses = await Expense.getMonthlyExpenses(months, req.businessId);
  
  res.json({
    success: true,
    data: monthlyExpenses
  });
}));

// GET /api/expenses/:id - Get expense by ID
router.get('/:id', catchAsync(async (req, res) => {
  const expense = await Expense.findById(req.params.id, req.businessId);
  
  if (!expense) {
    throw new AppError('Expense not found', 404);
  }
  
  res.json({
    success: true,
    data: expense
  });
}));

// POST /api/expenses - Create new expense
router.post('/', expenseValidationRules, validate, catchAsync(async (req, res) => {
  const expenseData = {
    ...req.body,
    amount: Number(parseFloat(req.body.amount || 0).toFixed(2)),
    created_by: req.body.created_by || 'system',
    businessId: req.businessId
  };

  const expense = await Expense.create(expenseData);
  
  // Real-time broadcast
  req.app.locals.broadcastDataChange('expense', expense);
  req.app.locals.clearDashboardCache();
  
  res.status(201).json({
    success: true,
    message: 'Expense created successfully',
    data: expense
  });
}));

// PUT /api/expenses/:id - Update expense
router.put('/:id', catchAsync(async (req, res) => {
  const expense = await Expense.findById(req.params.id, req.businessId);
  if (!expense) {
    throw new AppError('Expense not found', 404);
  }

  // Validate input (partial update)
  const errors = Expense.validateUpdate(req.body);
  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400);
  }

  if (req.body.amount) {
    req.body.amount = Number(parseFloat(req.body.amount).toFixed(2));
  }

  const updatedExpense = await Expense.update(req.params.id, req.body, req.businessId);
  
  // Real-time broadcast
  req.app.locals.broadcastDataChange('expense', updatedExpense);
  req.app.locals.clearDashboardCache();
  
  res.json({
    success: true,
    message: 'Expense updated successfully',
    data: updatedExpense
  });
}));

// PATCH /api/expenses/:id/approve - Approve expense
router.patch('/:id/approve', catchAsync(async (req, res) => {
  const expense = await Expense.findById(req.params.id, req.businessId);
  if (!expense) {
    throw new AppError('Expense not found', 404);
  }

  if (typeof Expense.approve !== 'function') {
    return res.status(501).json({ success: false, message: 'Expense approve endpoint not implemented' });
  }
  const approvedExpense = await Expense.approve(req.params.id, 'system', req.businessId);
  
  res.json({
    success: true,
    message: 'Expense approved successfully',
    data: approvedExpense
  });
  req.app.locals.clearDashboardCache();
}));

// PATCH /api/expenses/:id/reject - Reject expense
router.patch('/:id/reject', catchAsync(async (req, res) => {
  const expense = await Expense.findById(req.params.id, req.businessId);
  if (!expense) {
    throw new AppError('Expense not found', 404);
  }

  if (typeof Expense.reject !== 'function') {
    return res.status(501).json({ success: false, message: 'Expense reject endpoint not implemented' });
  }
  const rejectedExpense = await Expense.reject(req.params.id, 'system', req.businessId);
  
  res.json({
    success: true,
    message: 'Expense rejected successfully',
    data: rejectedExpense
  });
  req.app.locals.clearDashboardCache();
}));

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', catchAsync(async (req, res) => {
  const expense = await Expense.findById(req.params.id, req.businessId);
  if (!expense) {
    throw new AppError('Expense not found', 404);
  }

  await Expense.delete(req.params.id, req.businessId);
  
  // Real-time broadcast
  req.app.locals.broadcastDataChange('expense', { id: req.params.id, deleted: true });
  req.app.locals.clearDashboardCache();
  
  res.json({
    success: true,
    message: 'Expense deleted successfully'
  });
}));

module.exports = router;
