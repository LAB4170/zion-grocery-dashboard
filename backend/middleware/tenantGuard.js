const { AppError } = require('./errorHandler');

/**
 * Tenant Guard Middleware (Fail-Close)
 * This middleware ensures that a business context (businessId) is present 
 * on the request object before allowing access to tenant-specific resources.
 * 
 * It acts as a safety net in case a route is protected by requireBusinessAuth 
 * but somehow the businessId injection fails or is bypassed.
 */
const requireTenantContext = (req, res, next) => {
  // If we're on a multi-tenant route but have no business identity, 
  // we must FAIL-CLOSE immediately to prevent cross-tenant data leaks.
  if (!req.businessId) {
    console.error(`🛡️ TenantGuard Blocked Request: No business context found for ${req.method} ${req.originalUrl}`);
    
    return next(new AppError(
      'Security Error: Missing business context. Access denied.', 
      403 // Forbidden
    ));
  }

  // Double check that the businessId is a valid UUID format (extra security layer)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (typeof req.businessId === 'string' && !uuidRegex.test(req.businessId)) {
    console.error(`🛡️ TenantGuard Blocked Request: Invalid businessId format suspicious activity from ${req.ip}`);
    
    return next(new AppError(
      'Security Error: Invalid business identifier.', 
      400 // Bad Request
    ));
  }

  next();
};

module.exports = { requireTenantContext };
