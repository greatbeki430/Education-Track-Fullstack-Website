import express from "express";
import { db } from "../server.js";

const router = express.Router();

// GET all scores
router.get("/", async (req, res) => {
  try {
    const scores = await db.all("SELECT * FROM scores ORDER BY createdAt DESC");
    res.json(scores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new score
router.post("/", async (req, res) => {
  const { studentId, studentName, assessment, score } = req.body;
  if (!studentId || !studentName || !assessment || score === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const result = await db.run(
      "INSERT INTO scores (studentId, studentName, assessment, score) VALUES (?, ?, ?, ?)",
      [studentId, studentName, assessment, score],
    );
    const newScore = await db.get(
      "SELECT * FROM scores WHERE id = ?",
      result.lastID,
    );
    res.status(201).json(newScore);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update score
router.put("/:id", async (req, res) => {
  const { studentId, studentName, assessment, score } = req.body;
  const { id } = req.params;
  try {
    await db.run(
      "UPDATE scores SET studentId = ?, studentName = ?, assessment = ?, score = ? WHERE id = ?",
      [studentId, studentName, assessment, score, id],
    );
    const updated = await db.get("SELECT * FROM scores WHERE id = ?", id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE score
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.run("DELETE FROM scores WHERE id = ?", id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
