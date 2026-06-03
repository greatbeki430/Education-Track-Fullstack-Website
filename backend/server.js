import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ====================== CORS CONFIG ======================
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production" ? false : "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ====================== MIDDLEWARE ======================
app.use(express.json());
app.use(cookieParser());

// ====================== HEALTH CHECK ======================
app.get("/api/health", (req, res) => {
  res.json({
    message: "EduTrack Backend is running ✅",
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// ====================== PRODUCTION: SERVE FRONTEND ======================
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../frontend/dist");
  app.use(express.static(frontendPath));
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(frontendPath, "index.html"));
    }
  });
}

// ====================== IMPORT MODELS ======================
import User from "./models/User.js";

// ====================== DATABASE SETUP (MongoDB) ======================
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI is not defined in environment variables");
      return;
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB Connected Successfully");

    // Create default admin if not exists
    const adminExists = await User.findOne({ username: "admin" });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const admin = new User({
        username: "admin",
        password: hashedPassword,
        role: "admin",
        fullName: "System Administrator",
      });
      await admin.save();
      console.log(
        "✅ Created default admin user (username: admin, password: admin123)",
      );
    } else {
      console.log("✅ Admin user already exists");
    }
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
  }
};

// ====================== ROUTE IMPORTS ======================
import authRouter from "./routes/auth.js";
import scoresRouter from "./routes/scores.js";
import attendanceRouter from "./routes/attendance.js";
import examsRouter from "./routes/exams.js";
import announcementsRouter from "./routes/announcements.js";
import aiRouter from "./routes/ai.js";

// ====================== ROUTES ======================
app.use("/api/auth", authRouter);
app.use("/api/scores", scoresRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/exams", examsRouter);
app.use("/api/announcements", announcementsRouter);
app.use("/api/ai", aiRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// ====================== START SERVER ======================
if (process.env.NODE_ENV !== "production") {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📁 Environment: development`);
      console.log(`🍪 Cookie authentication: ENABLED`);
      console.log(`\n📝 Default login: admin / admin123\n`);
    });
  });
}

// ✅ CRITICAL: Export for Vercel serverless functions
export default app;
