const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const { catchAsync, AppError } = require('../middleware/errorHandler');

// GET /api/sales - Get all sales (supports pagination and filters)
router.get('/', catchAsync(async (req, res) => {
  const filters = {
    date_from: req.query.date_from,
    date_to: req.query.date_to,
    payment_method: req.query.payment_method,
    status: req.query.status,
    customer_name: req.query.customer_name
  };

  const page = req.query.page ? parseInt(req.query.page) : null;
  const perPage = req.query.perPage ? parseInt(req.query.perPage) : (req.query.per_page ? parseInt(req.query.per_page) : null);
  const sortBy = req.query.sortBy || req.query.sort_by || 'created_at';
  const sortDir = req.query.sortDir || req.query.sort_dir || 'desc';

  // If page/perPage provided, return paginated response
  if (page || perPage) {
    const result = await Sale.findPaginated(filters, {
      page: page || 1,
      perPage: perPage || 25,
      sortBy,
      sortDir
    });

    return res.json({
      success: true,
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
        sortBy,
        sortDir
      }
    });
  }

  // Backward compatible: return full list if no pagination requested
  const sales = await Sale.findAll(filters);
  
  res.json({
    success: true,
    data: sales,
    count: sales.length
  });
}));

// GET /api/sales/summary - Get sales summary
router.get('/summary', catchAsync(async (req, res) => {
  const filters = {
    date_from: req.query.date_from,
    date_to: req.query.date_to
  };

  const summary = await Sale.getSummary(filters);
  
  res.json({
    success: true,
    data: summary
  });
}));

// GET /api/sales/daily - Get daily sales
router.get('/daily', catchAsync(async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const dailySales = await Sale.getDailySales(days);
  
  res.json({
    success: true,
    data: dailySales
  });
}));

// GET /api/sales/top-products - Get top selling products
router.get('/top-products', catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const topProducts = await Sale.getTopProducts(limit);
  
  res.json({
    success: true,
    data: topProducts
  });
}));

// GET /api/sales/:id - Get sale by ID
router.get('/:id', catchAsync(async (req, res) => {
  const sale = await Sale.findById(req.params.id);
  
  if (!sale) {
    throw new AppError('Sale not found', 404);
  }
  
  res.json({
    success: true,
    data: sale
  });
}));

// POST /api/sales - Create new sale
router.post('/', catchAsync(async (req, res) => {
  // Validate input
  const errors = Sale.validate(req.body);
  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400);
  }

  // FIX: Pass complete sale data without modifying it
  const saleData = {
    ...req.body,
    // Don't override total if already calculated correctly in frontend
    total: req.body.total || (parseFloat(req.body.unit_price) * parseInt(req.body.quantity))
  };

  const sale = await Sale.create(saleData);
  
  res.status(201).json({
    success: true,
    message: 'Sale created successfully',
    data: sale
  });
}));

// PUT /api/sales/:id - Update sale
router.put('/:id', catchAsync(async (req, res) => {
  const sale = await Sale.findById(req.params.id);
  if (!sale) {
    throw new AppError('Sale not found', 404);
  }

  // Validate input
  const errors = Sale.validate(req.body);
  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400);
  }

  const updatedSale = await Sale.update(req.params.id, req.body);
  
  res.json({
    success: true,
    message: 'Sale updated successfully',
    data: updatedSale
  });
}));

// PATCH /api/sales/:id/status - Update sale status
router.patch('/:id/status', catchAsync(async (req, res) => {
  const { status } = req.body;
  
  if (!status || !['completed', 'pending', 'cancelled'].includes(status)) {
    throw new AppError('Valid status is required (completed, pending, cancelled)', 400);
  }

  const updatedSale = await Sale.update(req.params.id, { status });
  
  res.json({
    success: true,
    message: 'Sale status updated successfully',
    data: updatedSale
  });
}));

// DELETE /api/sales/:id - Delete sale
router.delete('/:id', catchAsync(async (req, res) => {
  const sale = await Sale.findById(req.params.id);
  if (!sale) {
    throw new AppError('Sale not found', 404);
  }

  const result = await Sale.delete(req.params.id);
   
   res.json({
     success: true,
     message: 'Sale deleted successfully',
     data: {
       product: result && result.product ? result.product : null
     }
   });
}));

module.exports = router;
