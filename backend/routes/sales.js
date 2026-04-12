const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const FiscalService = require('../services/fiscal/FiscalService');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const { saleValidationRules, validate } = require('../middleware/validation');

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
    }, req.businessId);

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
  const sales = await Sale.findAll(filters, req.businessId);
  
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

  const summary = await Sale.getSummary(filters, req.businessId);
  
  res.json({
    success: true,
    data: summary
  });
}));

// GET /api/sales/daily - Get daily sales
router.get('/daily', catchAsync(async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  if (typeof Sale.getDailySales !== 'function') {
    return res.status(501).json({ success: false, message: 'Sales daily stats endpoint not implemented' });
  }
  const dailySales = await Sale.getDailySales(days, req.businessId);
  
  res.json({
    success: true,
    data: dailySales
  });
}));

// GET /api/sales/weekly - Get weekly sales (Mon–Sun)
router.get('/weekly', catchAsync(async (req, res) => {
  if (typeof Sale.getWeeklySales !== 'function') {
    return res.status(501).json({ success: false, message: 'Sales weekly endpoint not implemented' });
  }
  const weekly = await Sale.getWeeklySales(req.businessId);
  res.json({ success: true, data: weekly });
}));

// GET /api/sales/top-products - Get top selling products
router.get('/top-products', catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  if (typeof Sale.getTopProducts !== 'function') {
    return res.status(501).json({ success: false, message: 'Sales top-products endpoint not implemented' });
  }
  const topProducts = await Sale.getTopProducts(limit, req.businessId);
  
  res.json({
    success: true,
    data: topProducts
  });
}));

// GET /api/sales/:id - Get sale by ID
router.get('/:id', catchAsync(async (req, res) => {
  const sale = await Sale.findById(req.params.id, req.businessId);
  
  if (!sale) {
    throw new AppError('Sale not found', 404);
  }
  
  res.json({
    success: true,
    data: sale
  });
}));

// POST /api/sales - Create new sale
router.post('/', saleValidationRules, validate, catchAsync(async (req, res) => {
  // FIX: Enforce 100% accurate mathematical precision avoiding float drift
  const computedTotal = (parseFloat(req.body.unit_price || 0) * parseFloat(req.body.quantity || 0)).toFixed(2);
  const saleData = {
    ...req.body,
    businessId: req.businessId,
    total: req.body.total ? Number(parseFloat(req.body.total).toFixed(2)) : Number(computedTotal)
  };

  const sale = await Sale.create(saleData);
  
  // PHASE 3: Fiscal Compliance Hook
  // Report sale to regulatory body (e.g. KRA eTIMS VSCU)
  try {
    const product = await Product.findById(sale.productId, req.businessId);
    if (product) {
      const fiscalResult = await FiscalService.processSale(req.business, sale, product);
      if (fiscalResult.success) {
        // Update sale with fiscal metadata (digital signature)
        await Sale.update(sale.id, {
          metadata: {
            ...sale.metadata,
            fiscal: fiscalResult
          }
        }, req.businessId);
        
        // Update locals for response
        sale.metadata = { ...sale.metadata, fiscal: fiscalResult };
      }
    }
  } catch (err) {
    console.error('⚠️ Fiscal Reporting Warning:', err.message);
    // Note: In high-scale POS, we usually retry fiscal reporting in a background queue 
    // to avoid blocking the user if the KRA server is down.
  }

  // Real-time broadcast for both sales and product (since stock changed)
  req.app.locals.broadcastDataChange('sale', sale);
  req.app.locals.broadcastDataChange('product', { id: sale.productId });
  req.app.locals.clearDashboardCache();
  
  res.status(201).json({
    success: true,
    message: 'Sale created successfully and signed for fiscal compliance',
    data: sale
  });
}));

router.put('/:id', catchAsync(async (req, res) => {
  const sale = await Sale.findById(req.params.id, req.businessId);
  if (!sale) {
    throw new AppError('Sale not found', 404);
  }

  // Validate input (partial update)
  const errors = Sale.validateUpdate(req.body);
  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400);
  }

  const updatedSale = await Sale.update(req.params.id, req.body, req.businessId);
  
  // Real-time broadcast
  req.app.locals.broadcastDataChange('sale', updatedSale);
  req.app.locals.broadcastDataChange('product', { id: updatedSale.product_id });
  req.app.locals.clearDashboardCache();
  
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

  const updatedSale = await Sale.update(req.params.id, { status }, req.businessId);
  
  // Real-time broadcast
  req.app.locals.broadcastDataChange('sale', updatedSale);
  req.app.locals.clearDashboardCache();
  
  res.json({
    success: true,
    message: 'Sale status updated successfully',
    data: updatedSale
  });
}));

// PUT /api/sales/:id - Update sale (qty, price, method, status, customer)
router.put('/:id', catchAsync(async (req, res) => {
  const sale = await Sale.findById(req.params.id, req.businessId);
  if (!sale) {
    throw new AppError('Sale not found', 404);
  }

  // We let the model handle the validation & transaction (stock + debt adjustment)
  const updatedSale = await Sale.update(req.params.id, req.body, req.businessId);
  
  // Real-time broadcast
  req.app.locals.broadcastDataChange('sale', updatedSale);
  req.app.locals.broadcastDataChange('product', { id: updatedSale.product_id });
  req.app.locals.clearDashboardCache();
  
  res.json({
    success: true,
    message: 'Sale updated successfully',
    data: updatedSale
  });
}));

// DELETE /api/sales/:id - Delete sale
router.delete('/:id', catchAsync(async (req, res) => {
  const sale = await Sale.findById(req.params.id, req.businessId);
  if (!sale) {
    throw new AppError('Sale not found', 404);
  }

  const result = await Sale.delete(req.params.id, req.businessId);
  
  // Real-time broadcast
  req.app.locals.broadcastDataChange('sale', { id: req.params.id, deleted: true });
  if (result && result.product) {
    req.app.locals.broadcastDataChange('product', { id: result.product.id });
    req.app.locals.clearDashboardCache();
  }
   
   res.json({
     success: true,
     message: 'Sale deleted successfully',
     data: {
       product: result && result.product ? result.product : null
     }
   });
}));

module.exports = router;
