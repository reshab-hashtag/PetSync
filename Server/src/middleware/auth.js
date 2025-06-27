const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId)
      .populate('business')
      .select('-auth.passwordHash');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not active.'
      });
    }

    req.user = {
      userId: user._id,
      role: user.role,
      businessId: user.business?._id,
      permissions: user.permissions,
      userData: user
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }
    
    res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).populate('business');

      if (user && user.isActive) {
        req.user = {
          userId: user._id,
          role: user.role,
          businessId: user.business?._id,
          permissions: user.permissions,
          userData: user
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = { authenticate, optionalAuth };