const express = require('express');
const router = express.Router();
const Debt = require('../models/Debt');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/auth');

// GET /api/debts - Get all debts
router.get('/', catchAsync(async (req, res) => {
  const filters = {
    status: req.query.status,
    customer_name: req.query.customer_name,
    customer_phone: req.query.customer_phone,
    date_from: req.query.date_from,
    date_to: req.query.date_to,
    overdue: req.query.overdue === 'true'
  };

  const debts = await Debt.findAll(filters);
  
  res.json({
    success: true,
    data: debts,
    count: debts.length
  });
}));

// GET /api/debts/summary - Get debts summary
router.get('/summary', catchAsync(async (req, res) => {
  const filters = {
    date_from: req.query.date_from,
    date_to: req.query.date_to
  };

  const summary = await Debt.getSummary(filters);
  
  res.json({
    success: true,
    data: summary
  });
}));

// GET /api/debts/grouped - Get debts grouped by customer
router.get('/grouped', catchAsync(async (req, res) => {
  const groupedDebts = await Debt.getGroupedByCustomer();
  
  res.json({
    success: true,
    data: groupedDebts
  });
}));

// GET /api/debts/overdue - Get overdue debts
router.get('/overdue', catchAsync(async (req, res) => {
  const overdueDebts = await Debt.getOverdue();
  
  res.json({
    success: true,
    data: overdueDebts,
    count: overdueDebts.length
  });
}));

// GET /api/debts/:id - Get debt by ID
router.get('/:id', catchAsync(async (req, res) => {
  const debt = await Debt.findById(req.params.id);
  
  if (!debt) {
    throw new AppError('Debt not found', 404);
  }
  
  res.json({
    success: true,
    data: debt
  });
}));

// GET /api/debts/:id/payments - Get payment history for a debt
router.get('/:id/payments', catchAsync(async (req, res) => {
  const debt = await Debt.findById(req.params.id);
  if (!debt) {
    throw new AppError('Debt not found', 404);
  }

  const payments = await Debt.getPaymentHistory(req.params.id);
  
  res.json({
    success: true,
    data: payments
  });
}));

// POST /api/debts - Create new debt
router.post('/', requireRole(['admin', 'manager', 'cashier']), catchAsync(async (req, res) => {
  // Validate input
  const errors = Debt.validate(req.body);
  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400);
  }

  const debtData = {
    ...req.body,
    user_id: req.user.id
  };

  const debt = await Debt.create(debtData);
  
  res.status(201).json({
    success: true,
    message: 'Debt created successfully',
    data: debt
  });
}));

// PUT /api/debts/:id - Update debt
router.put('/:id', requireRole(['admin', 'manager']), catchAsync(async (req, res) => {
  const debt = await Debt.findById(req.params.id);
  if (!debt) {
    throw new AppError('Debt not found', 404);
  }

  // Validate input
  const errors = Debt.validate(req.body);
  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400);
  }

  const updatedDebt = await Debt.update(req.params.id, req.body);
  
  res.json({
    success: true,
    message: 'Debt updated successfully',
    data: updatedDebt
  });
}));

// POST /api/debts/:id/payment - Make payment towards debt
router.post('/:id/payment', requireRole(['admin', 'manager', 'cashier']), catchAsync(async (req, res) => {
  const { amount, payment_method } = req.body;
  
  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    throw new AppError('Valid payment amount is required', 400);
  }

  if (!payment_method || !['cash', 'mpesa', 'bank'].includes(payment_method)) {
    throw new AppError('Valid payment method is required (cash, mpesa, bank)', 400);
  }

  const debt = await Debt.findById(req.params.id);
  if (!debt) {
    throw new AppError('Debt not found', 404);
  }

  const updatedDebt = await Debt.makePayment(req.params.id, amount, payment_method);
  
  res.json({
    success: true,
    message: 'Payment recorded successfully',
    data: updatedDebt
  });
}));

// DELETE /api/debts/:id - Delete debt
router.delete('/:id', requireRole(['admin']), catchAsync(async (req, res) => {
  const debt = await Debt.findById(req.params.id);
  if (!debt) {
    throw new AppError('Debt not found', 404);
  }

  await Debt.delete(req.params.id);
  
  res.json({
    success: true,
    message: 'Debt deleted successfully'
  });
}));

module.exports = router;
