import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcryptjs";

// Load environment variables
dotenv.config();

// Route imports
import authRouter from "./routes/auth.js";
import scoresRouter from "./routes/scores.js";
import attendanceRouter from "./routes/attendance.js";
import examsRouter from "./routes/exams.js";
import announcementsRouter from "./routes/announcements.js";
import aiRouter from "./routes/ai.js";

// Middleware imports
import { requireAuthCookie } from "./middleware/requireAuthCookie.js";
import { requireRole } from "./middleware/requireRole.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database
export let db;

// Add this near the top of your server.js
const originalConsoleWarn = console.warn;
console.warn = function (...args) {
  const message = args.join(" ");
  // Filter out pdf2json warnings
  if (
    message.includes("Warning: Setting up fake worker") ||
    message.includes("Warning: TODO: graphic state operator") ||
    message.includes("Warning: Found Type3 font") ||
    message.includes("Warning: Unsupported: field.type")
  ) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

async function initDB() {
  db = await open({
    filename: "./school.db",
    driver: sqlite3.Database,
  });

  // Create tables if they don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT,
      fullName TEXT,
      studentId TEXT UNIQUE,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId TEXT,
      subject TEXT,
      score INTEGER,
      examType TEXT,
      date DATE,
      FOREIGN KEY(studentId) REFERENCES users(studentId)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId TEXT,
      date DATE,
      status TEXT,
      class TEXT,
      FOREIGN KEY(studentId) REFERENCES users(studentId)
    );

    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      subject TEXT,
      questions TEXT,
      startTime TEXT,
      endTime TEXT,
      duration INTEGER,
      createdBy TEXT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP
   );
   CREATE TABLE IF NOT EXISTS exam_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      examId INTEGER,
      studentId TEXT,
      studentName TEXT,
      answers TEXT,
      score INTEGER,
      totalQuestions INTEGER,
      percentage REAL,
      submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(examId) REFERENCES exams(id)
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content TEXT,
      date DATE,
      createdBy TEXT
    );
  `);

  // Insert sample admin if not exists
  const adminExists = await db.get(
    "SELECT * FROM users WHERE username = 'admin'",
  );
  if (!adminExists) {
    // bcrypt is already imported at the top
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await db.run(
      "INSERT INTO users (username, password, role, fullName) VALUES (?, ?, ?, ?)",
      ["admin", hashedPassword, "admin", "System Administrator"],
    );
    console.log(
      "✅ Created default admin user (username: admin, password: admin123)",
    );
  } else {
    console.log("✅ Database already has admin user");
  }
}

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173", // Your Vite frontend URL
    credentials: true, // Required for cookies
  }),
);
app.use(express.json());
app.use(cookieParser());

// Create uploads directory if needed
const uploadDir = process.env.UPLOAD_DIR || "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log(`📁 Created uploads directory: ${uploadDir}`);
}

// Routes
app.use("/api/auth", authRouter);
app.use("/api/scores", requireAuthCookie, scoresRouter);
app.use("/api/attendance", requireAuthCookie, attendanceRouter);
app.use("/api/exams", requireAuthCookie, examsRouter);
app.use(
  "/api/announcements",
  requireAuthCookie,
  requireRole(["teacher", "admin"]),
  announcementsRouter,
);
app.use(
  "/api/ai",
  requireAuthCookie,
  requireRole(["teacher", "admin"]),
  aiRouter,
);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start server
async function startServer() {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📁 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🍪 Cookie authentication: ENABLED`);
      console.log(
        `🤖 Gemini AI: ${process.env.GEMINI_API_KEY ? "✅ Configured" : "❌ Not configured"}`,
      );
      console.log(`\n📝 Default login: admin / admin123\n`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
