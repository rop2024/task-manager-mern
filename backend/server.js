import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("common"));
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/phase1-db", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Atlas connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Simple Test Model
const TestSchema = new mongoose.Schema({
  message: {
    type: String,
    default: "Hello from MongoDB!",
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Test = mongoose.model("Test", TestSchema);

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Backend is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/api/hello", async (req, res) => {
  try {
    // Create or find a test document
    let testDoc = await Test.findOne();
    if (!testDoc) {
      testDoc = await Test.create({});
    }

    res.json({
      backend: "Hello from Express backend!",
      database: testDoc.message,
      databaseTimestamp: testDoc.timestamp,
      status: "Frontend and backend connected successfully!",
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Database connection failed", details: error.message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    database:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`🎯 Backend server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});
