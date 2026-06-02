import express from "express";
import Announcement from "../models/Announcement.js";

const router = express.Router();

// Get announcements
router.get("/", async (req, res) => {
  try {
    const { targetClass } = req.query;
    let query = {};

    if (targetClass) {
      query.$or = [{ targetClass: targetClass }, { targetClass: "all" }];
    } else {
      query.targetClass = { $in: ["all", targetClass] };
    }

    const announcements = await Announcement.find(query).sort({
      pinned: -1,
      createdAt: -1,
    });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create announcement
router.post("/", async (req, res) => {
  const { title, content, targetClass, author, pinned } = req.body;

  try {
    const announcement = new Announcement({
      title,
      content,
      targetClass: targetClass || "all",
      author,
      pinned: pinned || false,
    });

    await announcement.save();
    res.status(201).json(announcement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET announcements for TV display (optimized for TV)
router.get("/tv", async (req, res) => {
  try {
    const announcements = await Announcement.find({
      $or: [{ targetClass: "all" }, { targetClass: "teachers" }],
    })
      .sort({ pinned: -1, createdAt: -1 })
      .limit(20);

    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark announcement as displayed on TV (for analytics)
router.post("/tv/view/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await Announcement.findByIdAndUpdate(id, {
      $inc: { tv_view_count: 1 },
      last_tv_display: new Date(),
    });
    res.json({ message: "View recorded" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete announcement
router.delete("/:id", async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: "Announcement deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
