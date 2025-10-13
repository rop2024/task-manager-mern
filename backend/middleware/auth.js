import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes - Enhanced JWT verification
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for Bearer token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Also check for token in cookies (for web app sessions)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required. Please login.',
        code: 'NO_TOKEN'
      });
    }

    try {
      // Verify token with enhanced error handling
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Validate token structure
      if (!decoded.id || !decoded.iat) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token structure',
          code: 'INVALID_TOKEN'
        });
      }

      // Check if token is expired (additional safety check)
      const tokenAge = Date.now() - (decoded.iat * 1000);
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      
      if (tokenAge > maxAge) {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      // Get user from token (exclude password and sensitive fields)
      req.user = await User.findById(decoded.id).select('-password -resetPasswordToken -resetPasswordExpire');
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists. Please login again.',
          code: 'USER_NOT_FOUND'
        });
      }

      // Check if user account is active (if you have user status)
      if (req.user.status && req.user.status === 'inactive') {
        return res.status(401).json({
          success: false,
          message: 'Account is inactive. Please contact support.',
          code: 'ACCOUNT_INACTIVE'
        });
      }

      next();
    } catch (error) {
      let message = 'Token verification failed';
      let code = 'TOKEN_INVALID';

      if (error.name === 'TokenExpiredError') {
        message = 'Token expired. Please login again.';
        code = 'TOKEN_EXPIRED';
      } else if (error.name === 'JsonWebTokenError') {
        message = 'Invalid token. Please login again.';
        code = 'TOKEN_MALFORMED';
      } else if (error.name === 'NotBeforeError') {
        message = 'Token not active yet';
        code = 'TOKEN_NOT_ACTIVE';
      }

      return res.status(401).json({
        success: false,
        message,
        code
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication',
      code: 'SERVER_ERROR'
    });
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Ownership verification middleware - ensures users can only access their own resources
export const verifyOwnership = (model) => {
  return async (req, res, next) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID is required',
          code: 'MISSING_RESOURCE_ID'
        });
      }

      // Dynamic model import to avoid circular dependencies
      let Model;
      switch (model) {
        case 'Task':
          const TaskModel = await import('../models/Task.js');
          Model = TaskModel.default;
          break;
        case 'Group':
          const GroupModel = await import('../models/Group.js');
          Model = GroupModel.default;
          break;
        case 'InboxItem':
          const InboxModel = await import('../models/InboxItem.js');
          Model = InboxModel.default;
          break;
        case 'Draft':
          const DraftModel = await import('../models/Draft.js');
          Model = DraftModel.default;
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid model type for ownership verification',
            code: 'INVALID_MODEL'
          });
      }

      // Check if resource exists and belongs to the user
      const resource = await Model.findOne({
        _id: id,
        user: req.user.id
      });

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: `${model} not found or access denied`,
          code: 'RESOURCE_NOT_FOUND'
        });
      }

      // Add resource to request for use in route handlers
      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership verification error:', error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid resource ID format',
          code: 'INVALID_ID_FORMAT'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Server error in ownership verification',
        code: 'SERVER_ERROR'
      });
    }
  };
};

// Bulk ownership verification - for operations on multiple resources
export const verifyBulkOwnership = (model, idsField = 'ids') => {
  return async (req, res, next) => {
    try {
      const ids = req.body[idsField];
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: `${idsField} must be a non-empty array`,
          code: 'MISSING_RESOURCE_IDS'
        });
      }

      // Dynamic model import
      let Model;
      switch (model) {
        case 'Task':
          const TaskModel = await import('../models/Task.js');
          Model = TaskModel.default;
          break;
        case 'Group':
          const GroupModel = await import('../models/Group.js');
          Model = GroupModel.default;
          break;
        case 'InboxItem':
          const InboxModel = await import('../models/InboxItem.js');
          Model = InboxModel.default;
          break;
        case 'Draft':
          const DraftModel = await import('../models/Draft.js');
          Model = DraftModel.default;
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid model type for bulk ownership verification',
            code: 'INVALID_MODEL'
          });
      }

      // Verify all resources belong to the user
      const ownedResourcesCount = await Model.countDocuments({
        _id: { $in: ids },
        user: req.user.id
      });

      if (ownedResourcesCount !== ids.length) {
        return res.status(403).json({
          success: false,
          message: 'One or more resources not found or access denied',
          code: 'BULK_ACCESS_DENIED'
        });
      }

      next();
    } catch (error) {
      console.error('Bulk ownership verification error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Server error in bulk ownership verification',
        code: 'SERVER_ERROR'
      });
    }
  };
};

// Rate limiting per user - prevents abuse from authenticated users
export const createUserRateLimit = (options = {}) => {
  const rateLimit = require('express-rate-limit');
  
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 100, // limit each user to 100 requests per windowMs
    keyGenerator: (req) => req.user?.id || req.ip, // Use user ID if authenticated, otherwise IP
    message: {
      success: false,
      message: 'Too many requests from this user, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};
