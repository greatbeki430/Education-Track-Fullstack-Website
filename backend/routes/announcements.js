import express from "express";
import { db } from "../server.js";

const router = express.Router();

// Get announcements
router.get("/", async (req, res) => {
  try {
    const { targetClass } = req.query;
    let query =
      'SELECT * FROM announcements WHERE targetClass = ? OR targetClass = "all" ORDER BY pinned DESC, createdAt DESC';
    let params = [targetClass || "all"];

    const announcements = await db.all(query, params);
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create announcement
router.post("/", async (req, res) => {
  const { title, content, targetClass, author, pinned } = req.body;

  try {
    const result = await db.run(
      "INSERT INTO announcements (title, content, targetClass, author, pinned) VALUES (?, ?, ?, ?, ?)",
      [title, content, targetClass || "all", author, pinned ? 1 : 0],
    );
    const newAnnouncement = await db.get(
      "SELECT * FROM announcements WHERE id = ?",
      result.lastID,
    );
    res.status(201).json(newAnnouncement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET announcements for TV display (optimized for TV)
router.get("/tv", async (req, res) => {
  try {
    // Get only active, relevant announcements
    const announcements = await db.all(`
      SELECT * FROM announcements 
      WHERE (targetClass = 'all' OR targetClass = 'teachers')
      ORDER BY pinned DESC, createdAt DESC 
      LIMIT 20
    `);

    // Add expires_at logic if needed
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark announcement as displayed on TV (for analytics)
router.post("/tv/view/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.run(
      `
      UPDATE announcements 
      SET tv_view_count = COALESCE(tv_view_count, 0) + 1,
          last_tv_display = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      [id],
    );
    res.json({ message: "View recorded" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete announcement
router.delete("/:id", async (req, res) => {
  try {
    await db.run("DELETE FROM announcements WHERE id = ?", req.params.id);
    res.json({ message: "Announcement deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
