const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { catchAsync, AppError } = require('../middleware/errorHandler');

// GET /api/products - Get all products
router.get('/', catchAsync(async (req, res) => {
  const filters = {
    category: req.query.category,
    low_stock: req.query.low_stock === 'true',
    search: req.query.search
  };

  const products = await Product.findAll(filters);
  
  res.json({
    success: true,
    data: products,
    count: products.length
  });
}));

// GET /api/products/categories - Get all product categories
router.get('/categories', catchAsync(async (req, res) => {
  const categories = await Product.getCategories();
  
  res.json({
    success: true,
    data: categories
  });
}));

// GET /api/products/low-stock - Get low stock products
router.get('/low-stock', catchAsync(async (req, res) => {
  const products = await Product.getLowStock();
  
  res.json({
    success: true,
    data: products,
    count: products.length
  });
}));

// GET /api/products/:id - Get product by ID
router.get('/:id', catchAsync(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  
  res.json({
    success: true,
    data: product
  });
}));

// GET /api/products/:id/can-delete - Check if product can be deleted
router.get('/:id/can-delete', catchAsync(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const hasSales = await Product.hasSalesRecords(req.params.id);
  
  res.json({
    success: true,
    data: {
      canDelete: !hasSales,
      hasSalesRecords: hasSales,
      message: hasSales ? 'Product has sales records and cannot be deleted' : 'Product can be safely deleted'
    }
  });
}));

// POST /api/products - Create new product
router.post('/', catchAsync(async (req, res) => {
  // Validate input
  const errors = Product.validate(req.body);
  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400);
  }

  const productData = {
    ...req.body
  };

  const product = await Product.create(productData);
  
  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product
  });
}));

// PUT /api/products/:id - Update product
router.put('/:id', catchAsync(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Validate input
  const errors = Product.validate(req.body);
  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400);
  }

  const updatedProduct = await Product.update(req.params.id, req.body);
  
  res.json({
    success: true,
    message: 'Product updated successfully',
    data: updatedProduct
  });
}));

// PATCH /api/products/:id/stock - Update product stock
router.patch('/:id/stock', catchAsync(async (req, res) => {
  const { quantity, operation } = req.body;
  
  if (!quantity || !operation) {
    throw new AppError('Quantity and operation are required', 400);
  }

  if (!['add', 'subtract'].includes(operation)) {
    throw new AppError('Operation must be "add" or "subtract"', 400);
  }

  const updatedProduct = await Product.updateStock(req.params.id, quantity, operation);
  
  res.json({
    success: true,
    message: 'Stock updated successfully',
    data: updatedProduct
  });
}));

// DELETE /api/products/:id - Delete product
router.delete('/:id', catchAsync(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check if product has sales records before deletion
  const hasSales = await Product.hasSalesRecords(req.params.id);
  if (hasSales) {
    throw new AppError('Cannot delete product that has sales records. Please deactivate the product instead or remove all associated sales first.', 400);
  }

  await Product.delete(req.params.id);
  
  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
}));

module.exports = router;
