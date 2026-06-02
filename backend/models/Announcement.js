import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  targetClass: {
    type: String,
    default: "all",
  },
  author: {
    type: String,
  },
  pinned: {
    type: Boolean,
    default: false,
  },
  tv_view_count: {
    type: Number,
    default: 0,
  },
  last_tv_display: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Announcement", announcementSchema);
