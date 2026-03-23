const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Auth Middleware
 * Xác thực JWT token và gắn user vào req
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Lấy token từ header: Authorization: Bearer <token>
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized - no token'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');

    // Lấy user từ DB
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User not found or deactivated'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized - invalid token'
    });
  }
};

/**
 * Role-based access control
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

/**
 * Optional auth - gắn user nếu có token, nhưng không bắt buộc
 * Hữu ích cho routes vừa public vừa private
 */
const optionalAuth = async (req, res, next) => {
  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
      req.user = await User.findById(decoded.id);
    }
  } catch (error) {
    // Token invalid - bỏ qua, tiếp tục không auth
  }
  next();
};

module.exports = { protect, authorize, optionalAuth };
