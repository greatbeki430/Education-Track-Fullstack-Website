import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../server.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

// Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await db.get("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        studentId: user.studentId,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register student (teacher/admin only in production)
router.post("/register", async (req, res) => {
  const { username, password, fullName, studentId } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.run(
      "INSERT INTO users (username, password, role, fullName, studentId) VALUES (?, ?, ?, ?, ?)",
      [username, hashedPassword, "student", fullName, studentId],
    );
    res.status(201).json({ message: "Student registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
