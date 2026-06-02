import mongoose from "mongoose";

const scoreSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    ref: "User",
  },
  studentName: {
    type: String,
    required: true,
  },
  assessment: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Score", scoreSchema);
