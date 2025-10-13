import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';

// Enhanced security headers configuration
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.FRONTEND_URL, "https://api.github.com"].filter(Boolean),
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  
  // Strict Transport Security (HTTPS only in production)
  hsts: {
    maxAge: process.env.NODE_ENV === 'production' ? 31536000 : 0, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // Prevent clickjacking
  frameguard: { action: 'deny' },
  
  // Prevent MIME type sniffing
  noSniff: true,
  
  // XSS Protection
  xssFilter: true,
  
  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  
  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: { 
    policy: process.env.NODE_ENV === 'production' ? "same-site" : "cross-origin" 
  },
  
  // Hide X-Powered-By header
  hidePoweredBy: true,
  
  // Permissions Policy (Feature Policy)
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    payment: [],
    usb: [],
    magnetometer: [],
    gyroscope: [],
    accelerometer: []
  }
});

// API Rate limiting configuration
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // limit each IP
  message: {
    success: false,
    message: 'Too many API requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for successful requests during development
  skip: (req, res) => {
    return process.env.NODE_ENV !== 'production' && res.statusCode < 400;
  }
});

// Strict rate limiter for authentication routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // Very strict for auth
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Password reset rate limiter
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 password reset attempts per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.',
    code: 'PASSWORD_RESET_LIMIT_EXCEEDED',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Input sanitization middleware
export const sanitizeInput = [
  body('*').trim().escape(), // Basic HTML escaping for all fields
  body('email').optional().normalizeEmail(), // Normalize email format
  body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

// Validation error handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: formattedErrors
    });
  }
  next();
};

// Request logging for security monitoring
export const securityLogger = (req, res, next) => {
  // Log security-relevant events
  const securityEvents = [
    'POST /api/auth/login',
    'POST /api/auth/register',
    'POST /api/auth/forgot-password',
    'POST /api/auth/reset-password',
    'DELETE /api/users/',
    'PUT /api/users/',
  ];

  const isSecurityEvent = securityEvents.some(event => {
    const [method, path] = event.split(' ');
    return req.method === method && req.path.startsWith(path);
  });

  if (isSecurityEvent) {
    console.log(`🔐 Security Event: ${req.method} ${req.path} from ${req.ip} at ${new Date().toISOString()}`);
    
    // In production, you might want to send this to a security monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to security monitoring service
      // securityMonitor.log({ method: req.method, path: req.path, ip: req.ip, timestamp: new Date() });
    }
  }

  next();
};

// CORS security configuration
export const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:5173',
      'https://localhost:3000',
      'https://localhost:5173'
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, Postman, etc.) in development
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin',
    'Access-Control-Allow-Headers'
  ],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  maxAge: process.env.NODE_ENV === 'production' ? 86400 : 0, // Cache preflight for 1 day in production
};

// Environment-specific security configurations
export const getSecurityConfig = () => {
  const config = {
    development: {
      rateLimit: {
        enabled: false, // Disabled for easier testing
        windowMs: 15 * 60 * 1000,
        max: 1000
      },
      cors: {
        strictOrigin: false,
        allowNoOrigin: true
      },
      headers: {
        hsts: false,
        csp: 'relaxed'
      },
      logging: {
        level: 'debug',
        securityEvents: true
      }
    },
    staging: {
      rateLimit: {
        enabled: true,
        windowMs: 15 * 60 * 1000,
        max: 200
      },
      cors: {
        strictOrigin: true,
        allowNoOrigin: false
      },
      headers: {
        hsts: true,
        csp: 'strict'
      },
      logging: {
        level: 'info',
        securityEvents: true
      }
    },
    production: {
      rateLimit: {
        enabled: true,
        windowMs: 15 * 60 * 1000,
        max: 100
      },
      cors: {
        strictOrigin: true,
        allowNoOrigin: false
      },
      headers: {
        hsts: true,
        csp: 'strict'
      },
      logging: {
        level: 'warn',
        securityEvents: true
      }
    }
  };

  return config[process.env.NODE_ENV] || config.production;
};

// Security monitoring middleware (placeholder for future enhancements)
export const securityMonitor = (req, res, next) => {
  // Track suspicious activities
  const suspiciousPatterns = [
    /\.\.\//g, // Path traversal
    /<script>/gi, // XSS attempts
    /union.*select/gi, // SQL injection attempts
    /javascript:/gi, // JavaScript protocol
  ];

  const requestData = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params
  });

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestData));

  if (isSuspicious) {
    console.warn(`🚨 Suspicious request detected: ${req.method} ${req.path} from ${req.ip}`);
    // In production, you might want to:
    // 1. Log to security monitoring system
    // 2. Block the request
    // 3. Alert administrators
  }

  next();
};