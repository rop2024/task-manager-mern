import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import https from 'https';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Import security middleware
import { 
  securityHeaders, 
  apiLimiter, 
  authLimiter,
  corsOptions,
  securityLogger,
  securityMonitor,
  getSecurityConfig
} from './middleware/security.js';

// Initialize dotenv
dotenv.config();

// Define allowed origins for CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000"
].filter(Boolean);

// Import models - order matters to resolve circular dependencies
import './models/User.js';
import './models/Group.js';
import './models/Task.js';
import './models/Stats.js';
import './models/InboxItem.js'; // NEW: Import InboxItem model
import './models/Draft.js'; // NEW: Import Draft model

// Import routes
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js'; // This includes both regular and quick routes
import groupRoutes from './routes/groups.js';
import statsRoutes from './routes/stats.js';
import calendarRoutes from './routes/calendar.js';
import completedRoutes from './routes/completed.js';
import inboxRoutes from './routes/inbox.js'; // NEW: Import inbox routes
import draftsRoutes from './routes/drafts.js'; // NEW: Import drafts routes
import reviewRoutes from './routes/review.js'; // NEW: Import review routes
import { startReminderScheduler } from './middleware/reminders.js';
import { generalLimiter } from './middleware/rateLimiter.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Get security configuration for current environment
const securityConfig = getSecurityConfig();

// Enhanced security middleware
app.use(securityLogger); // Log security events
app.use(securityMonitor); // Monitor suspicious activities
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
})); // Secure CORS configuration
app.use(securityHeaders); // Enhanced security headers

// Logging configuration based on environment
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Body parsing middleware with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification if needed
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting based on environment configuration
if (securityConfig.rateLimit.enabled) {
  app.use(apiLimiter);
}

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/phase1-db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Atlas connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Mount routes with security middleware
app.use('/api/auth', authLimiter, authRoutes); // Extra rate limiting for auth
app.use('/api/tasks', taskRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/completed', completedRoutes);
app.use('/api/inbox', inboxRoutes);
app.use('/api/drafts', draftsRoutes);
app.use('/api/review', reviewRoutes);

// Enhanced test routes
app.get('/', (req, res) => res.json({
  message: '🚀 Backend is running!',
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV,
  version: '2.0.0',
  cors: {
    allowedOrigins,
    frontendUrl: process.env.FRONTEND_URL
  }
}));

app.get('/api/hello', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Hello from Task Manager API!',
      timestamp: new Date().toISOString(),
      database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// CORS pre-flight for all routes
app.options('*', cors());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error stack:', err.stack);
  
  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      success: false,
      error: 'CORS policy: Origin not allowed',
      allowedOrigins
    });
  }
  
  // General error
  res.status(500).json({ 
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
  });
});

// 404 handler
app.use('*', (req, res) => res.status(404).json({ 
  success: false,
  error: 'Route not found',
  path: req.originalUrl,
  method: req.method
}));

// Start reminder scheduler (in production only)
if (process.env.NODE_ENV === 'production') {
  startReminderScheduler();
}

// Server startup with HTTPS support in production
const startServer = () => {
  if (process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS === 'true') {
    // Production HTTPS server
    const httpsOptions = {
      key: fs.readFileSync(process.env.SSL_KEY_PATH),
      cert: fs.readFileSync(process.env.SSL_CERT_PATH)
    };

    const httpsServer = https.createServer(httpsOptions, app);
    
    httpsServer.listen(PORT, () => {
      console.log(`🔒 HTTPS Server running securely on port ${PORT}`);
      console.log(`🛡️ Security level: PRODUCTION`);
      console.log(`🌐 Domain: ${process.env.FRONTEND_URL}`);
    });

    // Also start HTTP server for redirects
    const httpApp = express();
    httpApp.use((req, res) => {
      res.redirect(`https://${req.headers.host}${req.url}`);
    });
    httpApp.listen(80, () => {
      console.log('🔀 HTTP redirect server running on port 80');
    });

  } else {
    // Development or staging HTTP server
    app.listen(PORT, () => {
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const allowedOrigins = corsOptions.origin ? 'Configured' : 'All origins';
      
      const messages = [
        `🎯 ${process.env.NODE_ENV?.toUpperCase() || 'DEV'} server running on ${protocol}://localhost:${PORT}`,
        `🛡️ Security config: ${securityConfig.rateLimit.enabled ? 'ENABLED' : 'RELAXED'}`,
        `🌐 CORS policy: ${allowedOrigins}`,
        `📊 Rate limiting: ${securityConfig.rateLimit.max} requests/${securityConfig.rateLimit.windowMs/60000} minutes`,
        `🔗 Health check: ${protocol}://localhost:${PORT}/api/health`,
        `🔐 Auth routes: ${protocol}://localhost:${PORT}/api/auth`,
        `📅 Calendar: ${protocol}://localhost:${PORT}/api/calendar`,
        `✅ Completed: ${protocol}://localhost:${PORT}/api/completed`,
        `📥 Inbox: ${protocol}://localhost:${PORT}/api/inbox`,
        `📝 Drafts: ${protocol}://localhost:${PORT}/api/drafts`,
        ...(process.env.NODE_ENV === 'production' ? ['🔔 Reminder scheduler: ACTIVE'] : []),
        `🔍 Security logging: ${securityConfig.logging.securityEvents ? 'ENABLED' : 'DISABLED'}`
      ];
      
      messages.forEach(message => console.log(message));
    });
  }
};

startServer();