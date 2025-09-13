// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle database connection errors
const handleDatabaseError = (err) => {
  if (err.code === 'ECONNREFUSED') {
    return new AppError('Database connection failed. Please try again later.', 503);
  }
  if (err.code === '28P01') {
    return new AppError('Database authentication failed', 503);
  }
  if (err.code === '3D000') {
    return new AppError('Database not found', 503);
  }
  return new AppError('Database error occurred', 500);
};

// Handle cast errors (invalid ObjectId)
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// Handle duplicate field errors
const handleDuplicateFieldsDB = (err) => {
  const value = err.detail.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

// Handle validation errors
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Handle JWT errors
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

// Standardized error response format
const createErrorResponse = (err, includeStack = false) => {
  const response = {
    success: false,
    error: {
      message: err.message,
      statusCode: err.statusCode,
      status: err.status,
      timestamp: new Date().toISOString()
    }
  };

  if (includeStack && err.stack) {
    response.error.stack = err.stack;
  }

  return response;
};

// Send error in development
const sendErrorDev = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json(createErrorResponse(err, true));
  }

  // RENDERED WEBSITE
  console.error('ERROR ', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message
  });
};

// Send error in production
const sendErrorProd = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json(createErrorResponse(err));
    }
    // Programming or other unknown error: don't leak error details
    console.error('ERROR ', err);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Something went wrong!',
        statusCode: 500,
        status: 'error',
        timestamp: new Date().toISOString()
      }
    });
  }

  // RENDERED WEBSITE
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }
  // Programming or other unknown error: don't leak error details
  console.error('ERROR ', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.'
  });
};

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Enhanced error logging
  console.error('ERROR ', {
    message: err.message,
    statusCode: err.statusCode,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific database errors
    if (err.code === 'ECONNREFUSED' || err.code === '28P01' || err.code === '3D000') {
      error = handleDatabaseError(err);
    }
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 23505) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};

// Catch async errors
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Handle unhandled routes
const handleNotFound = (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(err);
};

// Graceful error handling for database operations
const handleDatabaseOperation = async (operation, fallbackValue = null) => {
  try {
    return await operation();
  } catch (error) {
    console.error('Database operation failed:', error.message);
    if (process.env.NODE_ENV === 'development') {
      throw error;
    }
    return fallbackValue;
  }
};

module.exports = {
  AppError,
  errorHandler,
  catchAsync,
  handleNotFound,
  handleDatabaseOperation,
  createErrorResponse
};
