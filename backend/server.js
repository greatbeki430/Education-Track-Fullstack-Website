import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ====================== CORS ======================
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ====================== MIDDLEWARE ======================
app.use(express.json());
app.use(cookieParser());

// ====================== MODELS ======================
import User from "./models/User.js";

// ====================== DB CONNECTION ======================
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });

  isConnected = true;
  console.log("✅ MongoDB Connected");

  const adminExists = await User.findOne({ username: "admin" });
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await User.create({
      username: "admin",
      password: hashedPassword,
      role: "admin",
      fullName: "System Administrator",
    });
    console.log("✅ Default admin created (admin/admin123)");
  }
};

// ====================== DATABASE MIDDLEWARE ======================
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
    res.status(503).json({
      error: "Database unavailable",
      detail: err.message,
    });
  }
});

// ====================== HEALTH CHECK ======================
app.get("/api/health", (req, res) => {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  res.json({
    message: "EduTrack Backend is running ✅",
    timestamp: new Date().toISOString(),
    database: states[mongoose.connection.readyState] ?? "unknown",
    mongoUri: process.env.MONGODB_URI ? "set ✅" : "missing ❌",
    environment: process.env.NODE_ENV,
    frontendUrl: process.env.FRONTEND_URL || "not set",
  });
});

// ====================== ROUTES ======================
import authRouter from "./routes/auth.js";
import scoresRouter from "./routes/scores.js";
import attendanceRouter from "./routes/attendance.js";
import examsRouter from "./routes/exams.js";
import announcementsRouter from "./routes/announcements.js";
import aiRouter from "./routes/ai.js";

app.use("/api/auth", authRouter);
app.use("/api/scores", scoresRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/exams", examsRouter);
app.use("/api/announcements", announcementsRouter);
app.use("/api/ai", aiRouter);

// ====================== ERROR HANDLER ======================
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// ====================== START SERVER ======================
// Render runs a persistent process — always call app.listen()
connectDB()
  .then(() =>
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📁 Environment: ${process.env.NODE_ENV}`);
      if (process.env.NODE_ENV !== "production") {
        console.log(`📝 Default login: admin / admin123\n`);
      }
    }),
  )
  .catch((err) => {
    console.error("Failed to start:", err.message);
    process.exit(1);
  });
