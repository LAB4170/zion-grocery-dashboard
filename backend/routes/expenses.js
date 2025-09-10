const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { catchAsync, AppError } = require('../middleware/errorHandler');

// GET /api/expenses - Get all expenses
router.get('/', catchAsync(async (req, res) => {
  const filters = {
    category: req.query.category,
    status: req.query.status,
    date_from: req.query.date_from,
    date_to: req.query.date_to,
    search: req.query.search
  };

  const expenses = await Expense.findAll(filters);
  
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

  const summary = await Expense.getSummary(filters);
  
  res.json({
    success: true,
    data: summary
  });
}));

// GET /api/expenses/categories - Get expenses by category
router.get('/categories', catchAsync(async (req, res) => {
  const categories = await Expense.getByCategory();
  
  res.json({
    success: true,
    data: categories
  });
}));

// GET /api/expenses/monthly - Get monthly expenses
router.get('/monthly', catchAsync(async (req, res) => {
  const months = parseInt(req.query.months) || 12;
  const monthlyExpenses = await Expense.getMonthlyExpenses(months);
  
  res.json({
    success: true,
    data: monthlyExpenses
  });
}));

// GET /api/expenses/:id - Get expense by ID
router.get('/:id', catchAsync(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  
  if (!expense) {
    throw new AppError('Expense not found', 404);
  }
  
  res.json({
    success: true,
    data: expense
  });
}));

// POST /api/expenses - Create new expense
router.post('/', catchAsync(async (req, res) => {
  // Validate input
  const errors = Expense.validate(req.body);
  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400);
  }

  const expenseData = {
    ...req.body,
    created_by: req.body.created_by || 'system'
  };

  const expense = await Expense.create(expenseData);
  
  res.status(201).json({
    success: true,
    message: 'Expense created successfully',
    data: expense
  });
}));

// PUT /api/expenses/:id - Update expense
router.put('/:id', catchAsync(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) {
    throw new AppError('Expense not found', 404);
  }

  // Validate input
  const errors = Expense.validate(req.body);
  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400);
  }

  const updatedExpense = await Expense.update(req.params.id, req.body);
  
  res.json({
    success: true,
    message: 'Expense updated successfully',
    data: updatedExpense
  });
}));

// PATCH /api/expenses/:id/approve - Approve expense
router.patch('/:id/approve', catchAsync(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) {
    throw new AppError('Expense not found', 404);
  }

  if (expense.status === 'approved') {
    throw new AppError('Expense is already approved', 400);
  }

  const approvedExpense = await Expense.approve(req.params.id, 'system');
  
  res.json({
    success: true,
    message: 'Expense approved successfully',
    data: approvedExpense
  });
}));

// PATCH /api/expenses/:id/reject - Reject expense
router.patch('/:id/reject', catchAsync(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) {
    throw new AppError('Expense not found', 404);
  }

  if (expense.status === 'rejected') {
    throw new AppError('Expense is already rejected', 400);
  }

  const rejectedExpense = await Expense.reject(req.params.id, 'system');
  
  res.json({
    success: true,
    message: 'Expense rejected successfully',
    data: rejectedExpense
  });
}));

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', catchAsync(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) {
    throw new AppError('Expense not found', 404);
  }

  await Expense.delete(req.params.id);
  
  res.json({
    success: true,
    message: 'Expense deleted successfully'
  });
}));

module.exports = router;
