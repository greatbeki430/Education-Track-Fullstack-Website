import express from "express";
import { db } from "../server.js";

const router = express.Router();

// Get all exams
router.get("/", async (req, res) => {
  try {
    // const exams = await db.all("SELECT * FROM exams ORDER BY createdAt DESC");
    const exams = await db.all("SELECT * FROM exams ORDER BY date DESC");
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create exam
// Create exam
router.post("/", async (req, res) => {
  const {
    title,
    description,
    duration,
    startTime,
    endTime,
    questions,
    createdBy,
  } = req.body;

  try {
    const result = await db.run(
      "INSERT INTO exams (title, description, duration, startTime, endTime, questions, createdBy, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        title,
        description || "",
        duration || 30,
        startTime || null,
        endTime || null,
        JSON.stringify(questions),
        createdBy || "Unknown",
        new Date().toISOString(),
      ],
    );

    const newExam = await db.get(
      "SELECT * FROM exams WHERE id = ?",
      result.lastID,
    );
    res.status(201).json(newExam);
  } catch (err) {
    console.error("Error creating exam:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get exam by ID
router.get("/:id", async (req, res) => {
  try {
    const exam = await db.get(
      "SELECT * FROM exams WHERE id = ?",
      req.params.id,
    );
    if (!exam) return res.status(404).json({ error: "Exam not found" });
    exam.questions = JSON.parse(exam.questions);
    res.json(exam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit exam attempt
router.post("/:id/submit", async (req, res) => {
  const { studentId, studentName, answers } = req.body;
  const examId = req.params.id;

  try {
    const exam = await db.get("SELECT * FROM exams WHERE id = ?", examId);
    const questions = JSON.parse(exam.questions);

    // Auto-grade
    let score = 0;
    questions.forEach((q, idx) => {
      if (
        answers[idx] &&
        answers[idx].toLowerCase() === q.correctAnswer.toLowerCase()
      ) {
        score += q.points || 1;
      }
    });

    const result = await db.run(
      "INSERT INTO exam_attempts (examId, studentId, studentName, answers, score) VALUES (?, ?, ?, ?, ?)",
      [examId, studentId, studentName, JSON.stringify(answers), score],
    );

    res.json({
      score,
      total: questions.reduce((sum, q) => sum + (q.points || 1), 0),
      attemptId: result.lastID,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get exam results for a student
router.get("/results/:studentId", async (req, res) => {
  try {
    const results = await db.all(
      `SELECT e.title, ea.score, ea.submittedAt 
       FROM exam_attempts ea 
       JOIN exams e ON ea.examId = e.id 
       WHERE ea.studentId = ? 
       ORDER BY ea.submittedAt DESC`,
      [req.params.studentId],
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
