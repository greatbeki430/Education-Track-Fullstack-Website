import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import scoresRouter from "./routes/scores.js";
import bcrypt from "bcryptjs";
import attendanceRouter from "./routes/attendance.js";
import examsRouter from "./routes/exams.js";
import announcementsRouter from "./routes/announcements.js";
import authRouter from "./routes/auth.js";
import aiRouter from "./routes/ai.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite Database
export let db;
async function initDb() {
  db = await open({
    filename: "./db/database.sqlite",
    driver: sqlite3.Database,
  });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId TEXT NOT NULL,
      studentName TEXT NOT NULL,
      assessment TEXT NOT NULL,
      score INTEGER NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Attendance table
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId TEXT NOT NULL,
      studentName TEXT NOT NULL,
      date DATE NOT NULL,
      status TEXT CHECK(status IN ('present', 'absent', 'late')),
      class TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Exams table
    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      duration INTEGER NOT NULL,
      startTime DATETIME,
      endTime DATETIME,
      questions TEXT NOT NULL,
      createdBy TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Exam attempts
    CREATE TABLE IF NOT EXISTS exam_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      examId INTEGER NOT NULL,
      studentId TEXT NOT NULL,
      studentName TEXT NOT NULL,
      answers TEXT,
      score INTEGER,
      submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(examId) REFERENCES exams(id)
    );

    -- Announcements table
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      targetClass TEXT DEFAULT 'all',
      author TEXT,
      pinned BOOLEAN DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'teacher', 'student')),
      fullName TEXT,
      studentId TEXT UNIQUE
    );
  `);

  // Insert default admin if none exists
  const admin = await db.get("SELECT * FROM users WHERE username = ?", [
    "admin",
  ]);
  if (!admin) {
    // const bcrypt = await import("bcryptjs");
    // const hashedPassword = await bcrypt.hash("admin123", 10);
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await db.run(
      "INSERT INTO users (username, password, role, fullName) VALUES (?, ?, ?, ?)",
      ["admin", hashedPassword, "admin", "School Administrator"],
    );
    console.log("✅ Default admin created: username=admin, password=admin123");
  }

  console.log("✅ Database initialized with all tables");
  console.log("✅ SQLite database ready");
}
await initDb();

// Routes
app.use("/api/scores", scoresRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/exams", examsRouter);
app.use("/api/announcements", announcementsRouter);
app.use("/api/auth", authRouter);
app.use("/api/ai", aiRouter);

app.get("/", (req, res) => {
  res.json({ message: "EduTrack Ultimate API is running" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
