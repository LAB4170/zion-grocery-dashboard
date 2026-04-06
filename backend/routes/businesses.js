const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { catchAsync } = require('../middleware/errorHandler');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { requireTenantContext } = require('../middleware/tenantGuard');

// Validation for business registration/update
const businessValidationRules = [
  body('name').trim().notEmpty().withMessage('Business name is required').isLength({ min: 3, max: 100 })
];

// GET /api/business/me
// Fetches the business associated with the authenticated user
router.get('/me', catchAsync(async (req, res) => {
  const business = await db('businesses').where('owner_email', req.userEmail).first();
  if (!business) {
    return res.status(404).json({ success: false, message: 'No registered business', code: 'NO_BUSINESS_REGISTERED' });
  }

  res.json({ success: true, data: business });
}));

// POST /api/business
// Register a new business tenant and link to the user
router.post('/', businessValidationRules, validate, catchAsync(async (req, res) => {
  const { name } = req.body;
  const userEmail = req.userEmail;

  // Check if user already has a business
  const existing = await db('businesses').where('owner_email', userEmail).first();
  if (existing) {
    return res.status(400).json({ success: false, message: 'User already owns a business', data: existing });
  }

  const newBusiness = {
    id: uuidv4(),
    name: name.trim(),
    owner_email: userEmail,
    subscription_status: 'active',
    subscription_ends_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  await db('businesses').insert(newBusiness);

  res.status(201).json({ success: true, message: 'Business successfully created', data: newBusiness });
}));

// PUT /api/business/me
// Update the active business profile
router.put('/me', businessValidationRules, validate, requireTenantContext, catchAsync(async (req, res) => {
  const { name } = req.body;

  await db('businesses').where('id', req.businessId).update({
    name: name.trim(),
    updated_at: new Date().toISOString()
  });

  const updatedBusiness = await db('businesses').where('id', req.businessId).first();
  res.json({ success: true, message: 'Business updated successfully', data: updatedBusiness });
}));

module.exports = router;
