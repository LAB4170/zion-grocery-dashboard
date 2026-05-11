const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { catchAsync } = require('../middleware/errorHandler');

/**
 * GET /api/support/tickets
 * Get all tickets for the current business
 */
router.get('/tickets', catchAsync(async (req, res) => {
  const tickets = await db('support_tickets')
    .where({ business_id: req.businessId })
    .orderBy('updated_at', 'desc');
  
  res.json({ success: true, data: tickets });
}));

/**
 * POST /api/support/tickets
 * Create a new support ticket
 */
router.post('/tickets', catchAsync(async (req, res) => {
  const { subject, message } = req.body;
  
  if (!subject || !message) {
    return res.status(400).json({ success: false, message: 'Subject and message are required' });
  }

  const [ticket] = await db('support_tickets')
    .insert({
      business_id: req.businessId,
      subject,
      status: 'open',
      priority: 'medium'
    })
    .returning('*');

  await db('support_messages').insert({
    ticket_id: ticket.id,
    sender_id: req.user.uid,
    sender_role: 'merchant',
    content: message
  });

  res.status(201).json({ success: true, data: ticket });
}));

/**
 * GET /api/support/tickets/:id
 * Get ticket history
 */
router.get('/tickets/:id', catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const ticket = await db('support_tickets')
    .where({ id, business_id: req.businessId })
    .first();
  
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

  const messages = await db('support_messages')
    .where({ ticket_id: id })
    .orderBy('created_at', 'asc');

  res.json({ success: true, data: { ticket, messages } });
}));

/**
 * POST /api/support/tickets/:id/messages
 * Reply to a ticket
 */
router.post('/tickets/:id/messages', catchAsync(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  const ticket = await db('support_tickets')
    .where({ id, business_id: req.businessId })
    .first();
  
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

  const [message] = await db('support_messages')
    .insert({
      ticket_id: id,
      sender_id: req.user.uid,
      sender_role: 'merchant',
      content
    })
    .returning('*');

  // Mark ticket as open if it was resolved/closed
  await db('support_tickets')
    .where({ id })
    .update({ status: 'open', updated_at: new Date() });

  res.status(201).json({ success: true, data: message });
}));

module.exports = router;
