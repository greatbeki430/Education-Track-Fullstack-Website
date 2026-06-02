import express from "express";
import Score from "../models/Score.js";

const router = express.Router();

// GET all scores
router.get("/", async (req, res) => {
  try {
    const scores = await Score.find().sort({ createdAt: -1 });
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
    const newScore = new Score({
      studentId,
      studentName,
      assessment,
      score,
    });
    await newScore.save();
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
    const updated = await Score.findByIdAndUpdate(
      id,
      { studentId, studentName, assessment, score },
      { new: true, runValidators: true },
    );
    if (!updated) {
      return res.status(404).json({ error: "Score not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE score
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Score.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Score not found" });
    }
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
