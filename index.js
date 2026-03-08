import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import trackingRoutes from "./routes/trackingRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";

dotenv.config();

const app = express();

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// CORS — restrict to known origins
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json({ limit: "5mb" }));

// Global rate limiter — 200 requests per minute per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});
app.use(globalLimiter);

// Strict rate limiter for auth endpoints — 10 attempts per 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many login attempts. Please try again after 15 minutes." },
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/shipments", orderRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/settings", settingsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ message: "Internal server error" });
});

// Connect to MongoDB (cached for serverless)
let cachedConnection = null;
const connectDB = async () => {
  if (cachedConnection) return cachedConnection;
  if (mongoose.connections[0].readyState) {
    cachedConnection = mongoose.connections[0];
    return cachedConnection;
  }
  console.log("Attempting to connect to MongoDB...");
  try {
    cachedConnection = await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected successfully");
    return cachedConnection;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    throw err;
  }
};

// Only listen locally, not on Vercel
if (!process.env.VERCEL) {
  connectDB();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Vercel serverless handler
export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}
