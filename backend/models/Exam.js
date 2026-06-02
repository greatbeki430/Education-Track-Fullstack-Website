import mongoose from "mongoose";

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  duration: {
    type: Number,
    default: 30,
  },
  startTime: {
    type: String,
  },
  endTime: {
    type: String,
  },
  questions: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  createdBy: {
    type: String,
    default: "Unknown",
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Exam", examSchema);
