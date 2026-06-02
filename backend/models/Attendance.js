import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    ref: "User",
  },
  studentName: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["present", "absent", "late"],
    required: true,
  },
  class: {
    type: String,
    default: "Grade 11",
  },
});

// Compound index to prevent duplicate attendance records
attendanceSchema.index({ studentId: 1, date: 1, class: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
