const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// GET /api/business/me
// Fetches the business associated with the authenticated user
router.get('/me', async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) return res.status(401).json({ success: false, message: 'Missing email' });

    const business = await db('businesses').where('owner_email', userEmail).first();
    if (!business) {
      return res.status(404).json({ success: false, message: 'No registered business', code: 'NO_BUSINESS_REGISTERED' });
    }

    res.json({ success: true, data: business });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching business' });
  }
});

// POST /api/business
// Register a new business tenant and link to the user
router.post('/', async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) return res.status(401).json({ success: false, message: 'Missing email context' });

    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Business name is required' });
    }

    // Check if user already has a business
    const existing = await db('businesses').where('owner_email', userEmail).first();
    if (existing) {
      return res.status(400).json({ success: false, message: 'User already owns a business', data: existing });
    }

    const newBusiness = {
      id: uuidv4(),
      name: name.trim(),
      owner_email: userEmail,
      subscription_status: 'trial',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      created_at: new Date(),
      updated_at: new Date()
    };

    await db('businesses').insert(newBusiness);

    res.status(201).json({ success: true, message: 'Business successfully created', data: newBusiness });
  } catch (error) {
    console.error('Error creating business:', error);
    res.status(500).json({ success: false, message: 'Server error creating business' });
  }
});

// PUT /api/business/me
// Update the active business profile
router.put('/me', async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) return res.status(401).json({ success: false, message: 'Missing email' });

    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Business name is required' });
    }

    const business = await db('businesses').where('owner_email', userEmail).first();
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    await db('businesses').where('id', business.id).update({
      name: name.trim(),
      updated_at: new Date()
    });

    const updatedBusiness = { ...business, name: name.trim(), updated_at: new Date() };
    res.json({ success: true, message: 'Business updated successfully', data: updatedBusiness });
  } catch (error) {
    console.error('Error updating business:', error);
    res.status(500).json({ success: false, message: 'Server error updating business' });
  }
});

module.exports = router;
