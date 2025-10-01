import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Import routes
import authRoutes from "./routes/auth.js";
import { generalLimiter } from "./middleware/rateLimiter.js";


// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Existing test routes (keep these)
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Backend is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '2.0.0'
  });
});

app.get('/api/hello', async (req, res) => {
  // ... keep existing hello endpoint code
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    error: 'Something went wrong!' 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found' 
  });
});

app.listen(PORT, () => {
  console.log(`🎯 Backend server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth routes available at: http://localhost:${PORT}/api/auth`);
});