import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { requireAuthCookie } from "../middleware/requireAuthCookie.js";

const router = express.Router();

/**
 * LOGIN - Sets httpOnly cookie AND returns token (for frontend compatibility)
 * POST /api/auth/login
 */
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    // Check if JWT_SECRET exists (security fail-fast)
    if (!process.env.JWT_SECRET) {
      console.error("FATAL: JWT_SECRET not set in environment");
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Find user in MongoDB
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare password with hashed version
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Create JWT payload (keep it minimal - no sensitive data)
    const payload = {
      id: user._id,
      username: user.username,
      role: user.role,
      studentId: user.studentId || null,
    };

    // Sign the token
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    });

    // Set httpOnly cookie (browser stores it, JS cannot read it)
    res.cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    // Return token in body for frontend compatibility
    res.json({
      token,
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        studentId: user.studentId,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * LOGOUT - Clear the httpOnly cookie
 * POST /api/auth/logout
 */
router.post("/logout", (req, res) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  res.json({ message: "Logged out successfully" });
});

/**
 * GET CURRENT USER - Verify token and return user info
 * GET /api/auth/me
 */
router.get("/me", requireAuthCookie, (req, res) => {
  res.json({
    user: req.user,
    authenticated: true,
  });
});

/**
 * REGISTER (Admin only - for creating teachers/students)
 * POST /api/auth/register
 */
router.post("/register", requireAuthCookie, async (req, res) => {
  // Only admin can register new users
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Only admin can create new users" });
  }

  const { username, password, role, fullName, studentId } = req.body;

  try {
    // Validate required fields
    if (!username || !password || !role) {
      return res
        .status(400)
        .json({ error: "Username, password, and role required" });
    }

    // Check if username exists
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      username,
      password: hashedPassword,
      role,
      fullName: fullName || null,
      studentId: studentId || null,
    });

    await user.save();

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        studentId: user.studentId,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

export default router;
