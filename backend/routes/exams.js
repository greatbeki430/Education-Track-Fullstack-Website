import express from "express";
import Exam from "../models/Exam.js";
import ExamAttempt from "../models/ExamAttempt.js";

const router = express.Router();

// Get all exams
router.get("/", async (req, res) => {
  try {
    const exams = await Exam.find().sort({ date: -1 });
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
    const exam = new Exam({
      title,
      description: description || "",
      duration: duration || 30,
      startTime: startTime || null,
      endTime: endTime || null,
      questions: questions,
      createdBy: createdBy || "Unknown",
    });

    await exam.save();
    res.status(201).json(exam);
  } catch (err) {
    console.error("Error creating exam:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get exam by ID
router.get("/:id", async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: "Exam not found" });
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
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    const questions = exam.questions;

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

    const total = questions.reduce((sum, q) => sum + (q.points || 1), 0);

    const attempt = new ExamAttempt({
      examId,
      studentId,
      studentName,
      answers,
      score,
      totalQuestions: questions.length,
    });

    await attempt.save();

    res.json({
      score,
      total,
      attemptId: attempt._id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get exam results for a student
router.get("/results/:studentId", async (req, res) => {
  try {
    const results = await ExamAttempt.find({ studentId: req.params.studentId })
      .populate("examId", "title")
      .sort({ submittedAt: -1 });

    const formattedResults = results.map((r) => ({
      title: r.examId?.title || "Unknown Exam",
      score: r.score,
      submittedAt: r.submittedAt,
    }));

    res.json(formattedResults);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
