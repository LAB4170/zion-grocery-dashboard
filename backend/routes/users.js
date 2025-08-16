const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// GET /api/users - Get all users (admin only)
router.get('/', requireRole(['admin']), catchAsync(async (req, res) => {
  const users = await db('users')
    .select(['id', 'username', 'email', 'role', 'is_active', 'created_at', 'last_login'])
    .orderBy('created_at', 'desc');
  
  res.json({
    success: true,
    data: users,
    count: users.length
  });
}));

// GET /api/users/:id - Get user by ID (admin only)
router.get('/:id', requireRole(['admin']), catchAsync(async (req, res) => {
  const user = await db('users')
    .select(['id', 'username', 'email', 'role', 'is_active', 'created_at', 'last_login'])
    .where('id', req.params.id)
    .first();
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  res.json({
    success: true,
    data: user
  });
}));

// POST /api/users - Create new user (admin only)
router.post('/', requireRole(['admin']), catchAsync(async (req, res) => {
  const { username, email, password, role = 'cashier' } = req.body;

  // Validation
  if (!username || !email || !password) {
    throw new AppError('Username, email, and password are required', 400);
  }

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters long', 400);
  }

  if (!['admin', 'manager', 'cashier'].includes(role)) {
    throw new AppError('Invalid role. Must be admin, manager, or cashier', 400);
  }

  // Check if user already exists
  const existingUser = await db('users')
    .where('email', email)
    .orWhere('username', username)
    .first();

  if (existingUser) {
    throw new AppError('User with this email or username already exists', 409);
  }

  // Hash password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const [newUser] = await db('users')
    .insert({
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      role,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    })
    .returning(['id', 'username', 'email', 'role', 'is_active', 'created_at']);

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: newUser
  });
}));

// PUT /api/users/:id - Update user (admin only)
router.put('/:id', requireRole(['admin']), catchAsync(async (req, res) => {
  const { username, email, role, is_active } = req.body;
  
  const user = await db('users').where('id', req.params.id).first();
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const updateData = { updated_at: new Date() };
  
  if (username) updateData.username = username;
  if (email) updateData.email = email;
  if (role && ['admin', 'manager', 'cashier'].includes(role)) {
    updateData.role = role;
  }
  if (typeof is_active === 'boolean') {
    updateData.is_active = is_active;
  }

  // Check if username/email already exists (excluding current user)
  if (username || email) {
    const existingUser = await db('users')
      .where(function() {
        if (username) this.where('username', username);
        if (email) this.orWhere('email', email);
      })
      .where('id', '!=', req.params.id)
      .first();

    if (existingUser) {
      throw new AppError('Username or email already exists', 409);
    }
  }

  const [updatedUser] = await db('users')
    .where('id', req.params.id)
    .update(updateData)
    .returning(['id', 'username', 'email', 'role', 'is_active', 'updated_at']);

  res.json({
    success: true,
    message: 'User updated successfully',
    data: updatedUser
  });
}));

// PATCH /api/users/:id/password - Reset user password (admin only)
router.patch('/:id/password', requireRole(['admin']), catchAsync(async (req, res) => {
  const { password } = req.body;
  
  if (!password || password.length < 6) {
    throw new AppError('Password must be at least 6 characters long', 400);
  }

  const user = await db('users').where('id', req.params.id).first();
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Hash new password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  await db('users')
    .where('id', req.params.id)
    .update({
      password: hashedPassword,
      updated_at: new Date()
    });

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
}));

// PATCH /api/users/:id/toggle-status - Toggle user active status (admin only)
router.patch('/:id/toggle-status', requireRole(['admin']), catchAsync(async (req, res) => {
  const user = await db('users').where('id', req.params.id).first();
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const [updatedUser] = await db('users')
    .where('id', req.params.id)
    .update({
      is_active: !user.is_active,
      updated_at: new Date()
    })
    .returning(['id', 'username', 'email', 'role', 'is_active', 'updated_at']);

  res.json({
    success: true,
    message: `User ${updatedUser.is_active ? 'activated' : 'deactivated'} successfully`,
    data: updatedUser
  });
}));

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', requireRole(['admin']), catchAsync(async (req, res) => {
  const user = await db('users').where('id', req.params.id).first();
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent admin from deleting themselves
  if (req.params.id === req.user.id) {
    throw new AppError('You cannot delete your own account', 400);
  }

  await db('users').where('id', req.params.id).del();
  
  res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));

module.exports = router;
