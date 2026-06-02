import mongoose from "mongoose";

const examAttemptSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exam",
    required: true,
  },
  studentId: {
    type: String,
    required: true,
    ref: "User",
  },
  studentName: {
    type: String,
    required: true,
  },
  answers: {
    type: mongoose.Schema.Types.Mixed,
  },
  score: {
    type: Number,
    default: 0,
  },
  totalQuestions: {
    type: Number,
    default: 0,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("ExamAttempt", examAttemptSchema);
