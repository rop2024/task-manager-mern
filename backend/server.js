import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

// Import models - order matters to resolve circular dependencies
import './models/User.js';
import './models/Group.js';
import './models/Task.js';
import './models/Stats.js';
import './models/QuickTask.js';

import taskRoutes from "./routes/tasks.js";
import groupRoutes from "./routes/groups.js";
import statsRoutes from "./routes/stats.js";
import calendarRoutes from "./routes/calendar.js";
import completedRoutes from "./routes/completed.js";
import quickTaskRoutes from "./routes/quickTasks.js";
import { startReminderScheduler } from "./middleware/reminders.js";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Import routes
import authRoutes from "./routes/auth.js";
import { generalLimiter } from "./middleware/rateLimiter.js";

// CORS configuration - FIXED
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:5173" // Vite default port
].filter(Boolean); // Remove any undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowedOrigin => 
      origin === allowedOrigin || 
      origin.startsWith(allowedOrigin.replace('https://', 'http://'))
    )) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Important for CORS
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply general rate limiting to all routes
app.use(generalLimiter);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/phase1-db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Atlas connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes); 
app.use('/api/groups', groupRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/completed', completedRoutes); // Added completed tasks API
app.use('/api/quickTasks', quickTaskRoutes); // Added quick tasks API

// Enhanced test routes
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Backend is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '2.0.0',
    cors: {
      allowedOrigins: allowedOrigins,
      frontendUrl: process.env.FRONTEND_URL
    }
  });
});

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
  res.json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV,
    cors: {
      allowedOrigins: allowedOrigins.length,
      frontendUrl: process.env.FRONTEND_URL
    }
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
      allowedOrigins: allowedOrigins
    });
  }
  
  // General error
  res.status(500).json({ 
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Start reminder scheduler (in production only)
if (process.env.NODE_ENV === 'production') {
  startReminderScheduler();
}

app.listen(PORT, () => {
  console.log(`🎯 Backend server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Allowed CORS origins:`, allowedOrigins);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth routes available at: http://localhost:${PORT}/api/auth`);
  console.log(`📅 Calendar routes: http://localhost:${PORT}/api/calendar`);
  console.log(`✅ Completed tasks routes: http://localhost:${PORT}/api/completed`);
  if (process.env.NODE_ENV === 'production') {
    console.log('🔔 Reminder scheduler: ACTIVE');
  }
});