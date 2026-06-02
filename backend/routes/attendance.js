import express from "express";
import Attendance from "../models/Attendance.js";

const router = express.Router();

// Get all attendance records
router.get("/", async (req, res) => {
  try {
    const { startDate, endDate, studentId } = req.query;
    let query = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    if (studentId) {
      query.studentId = studentId;
    }

    const attendance = await Attendance.find(query).sort({ date: -1 });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark attendance
router.post("/", async (req, res) => {
  const { records } = req.body; // Array of {studentId, studentName, status, date, class}

  try {
    const results = [];
    for (const record of records) {
      const attendance = await Attendance.findOneAndUpdate(
        {
          studentId: record.studentId,
          date: record.date,
          class: record.class || "Grade 11",
        },
        {
          studentId: record.studentId,
          studentName: record.studentName,
          date: record.date,
          status: record.status,
          class: record.class || "Grade 11",
        },
        { upsert: true, new: true },
      );
      results.push(attendance);
    }
    res.json({
      message: "Attendance saved successfully",
      count: results.length,
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
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;

    const stats = await Attendance.aggregate([
      {
        $match: {
          studentId: studentId,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } },
          total: { $sum: 1 },
        },
      },
    ]);

    res.json(stats[0] || { present: 0, absent: 0, late: 0, total: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
