const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// POST /api/auth/register - Register new user
router.post('/register', catchAsync(async (req, res) => {
  const { username, email, password, role = 'cashier' } = req.body;

  // Validation
  if (!username || !email || !password) {
    throw new AppError('Username, email, and password are required', 400);
  }

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters long', 400);
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

  // Generate JWT token
  const token = jwt.sign(
    { userId: newUser.id, username: newUser.username, role: newUser.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: newUser,
      token
    }
  });
}));

// POST /api/auth/login - Login user
router.post('/login', catchAsync(async (req, res) => {
  const { username, password } = req.body;

  // Validation
  if (!username || !password) {
    throw new AppError('Username and password are required', 400);
  }

  // Find user
  const user = await db('users')
    .where('username', username)
    .orWhere('email', username)
    .first();

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  if (!user.is_active) {
    throw new AppError('Account is deactivated', 401);
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  // Update last login
  await db('users')
    .where('id', user.id)
    .update({ last_login: new Date() });

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        last_login: new Date()
      },
      token
    }
  });
}));

// POST /api/auth/refresh - Refresh JWT token
router.post('/refresh', authenticateToken, catchAsync(async (req, res) => {
  // Generate new token
  const token = jwt.sign(
    { userId: req.user.id, username: req.user.username, role: req.user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: { token }
  });
}));

// GET /api/auth/profile - Get user profile
router.get('/profile', authenticateToken, catchAsync(async (req, res) => {
  const user = await db('users')
    .select(['id', 'username', 'email', 'role', 'is_active', 'created_at', 'last_login'])
    .where('id', req.user.id)
    .first();

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: user
  });
}));

// PUT /api/auth/profile - Update user profile
router.put('/profile', authenticateToken, catchAsync(async (req, res) => {
  const { username, email } = req.body;
  const updateData = {};

  if (username) updateData.username = username;
  if (email) updateData.email = email;
  updateData.updated_at = new Date();

  // Check if username/email already exists (excluding current user)
  if (username || email) {
    const existingUser = await db('users')
      .where(function() {
        if (username) this.where('username', username);
        if (email) this.orWhere('email', email);
      })
      .where('id', '!=', req.user.id)
      .first();

    if (existingUser) {
      throw new AppError('Username or email already exists', 409);
    }
  }

  const [updatedUser] = await db('users')
    .where('id', req.user.id)
    .update(updateData)
    .returning(['id', 'username', 'email', 'role', 'is_active', 'updated_at']);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedUser
  });
}));

// PUT /api/auth/change-password - Change password
router.put('/change-password', authenticateToken, catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters long', 400);
  }

  // Get current user with password
  const user = await db('users').where('id', req.user.id).first();
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Hash new password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await db('users')
    .where('id', req.user.id)
    .update({
      password: hashedNewPassword,
      updated_at: new Date()
    });

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

// POST /api/auth/logout - Logout (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = router;
