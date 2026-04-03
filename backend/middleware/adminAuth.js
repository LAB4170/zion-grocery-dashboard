/**
 * Admin Authentication Middleware
 * Checks for a secret key in the request headers to allow access to admin-only APIs.
 * Lewis should set ADMIN_SECRET in the environment variables (e.g., Render Dashboard).
 */
const requireAdminAuth = (req, res, next) => {
  const adminSecret = process.env.ADMIN_SECRET;
  const providedSecret = req.headers['x-admin-key'];

  if (!adminSecret) {
    console.error('❌ ADMIN_SECRET is not set in environment variables!');
    return res.status(500).json({ 
      success: false, 
      message: 'Admin access is currently misconfigured. Please set ADMIN_SECRET.' 
    });
  }

  if (providedSecret !== adminSecret) {
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized. Invalid admin secret key.' 
    });
  }

  next();
};

module.exports = { requireAdminAuth };
