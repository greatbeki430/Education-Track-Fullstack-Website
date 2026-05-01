import express from "express";
import { db } from "../server.js";

const router = express.Router();

// Get all attendance records
router.get("/", async (req, res) => {
  try {
    const { startDate, endDate, studentId } = req.query;
    let query = "SELECT * FROM attendance WHERE 1=1";
    const params = [];

    if (startDate) {
      query += " AND date >= ?";
      params.push(startDate);
    }
    if (endDate) {
      query += " AND date <= ?";
      params.push(endDate);
    }
    if (studentId) {
      query += " AND studentId = ?";
      params.push(studentId);
    }

    query += " ORDER BY date DESC";
    const attendance = await db.all(query, params);
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark attendance
router.post("/", async (req, res) => {
  const { records } = req.body; // Array of {studentId, studentName, status, date, class}

  try {
    for (const record of records) {
      await db.run(
        `INSERT OR REPLACE INTO attendance (studentId, studentName, date, status, class)
         VALUES (?, ?, ?, ?, ?)`,
        [
          record.studentId,
          record.studentName,
          record.date,
          record.status,
          record.class || "Grade 11",
        ],
      );
    }
    res.json({
      message: "Attendance saved successfully",
      count: records.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get attendance statistics
router.get("/stats/:studentId", async (req, res) => {
  const { studentId } = req.params;
  const { month } = req.query;

  try {
    const stats = await db.get(
      `SELECT 
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
        COUNT(*) as total
       FROM attendance 
       WHERE studentId = ? AND strftime('%Y-%m', date) = ?`,
      [studentId, month],
    );
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
