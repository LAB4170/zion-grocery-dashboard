const express = require('express');
const router = express.Router();
const ProcurementService = require('../services/supply/ProcurementService');

/**
 * @route GET /api/procurement/suppliers
 * @desc Get all suppliers for the business
 */
router.get('/suppliers', async (req, res) => {
  try {
    const suppliers = await ProcurementService.listSuppliers(req.businessId);
    res.json({ success: true, data: suppliers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @route POST /api/procurement/suppliers
 * @desc Create a new supplier
 */
router.post('/suppliers', async (req, res) => {
  try {
    const supplier = await ProcurementService.createSupplier(req.businessId, req.body);
    res.status(201).json({ success: true, data: supplier });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @route POST /api/procurement/receive
 * @desc Atomically receive a purchase order
 */
router.post('/receive', async (req, res) => {
  try {
    const po = await ProcurementService.receivePurchaseOrder(req.businessId, req.body);
    res.status(201).json({ success: true, data: po });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @route GET /api/procurement/history
 * @desc Get purchase order history
 */
router.get('/history', async (req, res) => {
  try {
    const history = await ProcurementService.getPurchaseHistory(req.businessId);
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
