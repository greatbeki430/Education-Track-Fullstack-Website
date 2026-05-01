import React, { useState, useEffect } from "react";
import api from "../api";
import html2pdf from "html2pdf.js";

export default function Announcements({ user }) {
  const [announcements, setAnnouncements] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [targetClass, setTargetClass] = useState("all");
  const [isPinned, setIsPinned] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get("/announcements");
      setAnnouncements(res.data);
    } catch (err) {
      console.error("Error fetching announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  const createAnnouncement = async () => {
    if (!newTitle || !newContent) {
      alert("Please fill in both title and content");
      return;
    }
    try {
      await api.post("/announcements", {
        title: newTitle,
        content: newContent,
        targetClass,
        author: user?.fullName || user?.username || "Teacher",
        pinned: isPinned,
      });
      setNewTitle("");
      setNewContent("");
      setTargetClass("all");
      setIsPinned(false);
      setShowForm(false);
      fetchAnnouncements();
    } catch (err) {
      alert("Error creating announcement");
    }
  };

  const deleteAnnouncement = async (id) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      try {
        await api.delete(`/announcements/${id}`);
        fetchAnnouncements();
      } catch (err) {
        alert("Error deleting announcement");
      }
    }
  };

  const exportToPDF = () => {
    const element = document.createElement("div");
    element.innerHTML = `
      <div style="padding: 2rem; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 2rem;">
          <h1 style="color: #1e466e;">📢 Meskerem Secondary School</h1>
          <h2>Announcements Archive</h2>
          <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
        ${announcements
          .map(
            (a) => `
          <div style="margin-bottom: 1.5rem; padding: 1rem; border: 1px solid #ddd; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h3 style="color: #2c7da0; margin: 0;">${a.title} ${
                a.pinned ? "📌" : ""
              }</h3>
              <small>${new Date(a.createdAt).toLocaleDateString()}</small>
            </div>
            <small style="color: #666;">Target: ${a.targetClass} | By: ${
              a.author
            }</small>
            <p style="margin-top: 0.5rem;">${a.content}</p>
          </div>
        `,
          )
          .join("")}
      </div>
    `;
    html2pdf().from(element).save();
  };

  return (
    <div className="announcements-container">
      {/* Header Section */}
      <div className="announcements-header">
        <div className="announcements-title-section">
          <div className="announcements-icon">📢</div>
          <div>
            <h1>School Announcements Board</h1>
            <p>Stay updated with latest news and events</p>
          </div>
        </div>
        <div className="announcements-actions">
          <button onClick={exportToPDF} className="btn-export">
            📑 Export to PDF
          </button>
          {(user?.role === "admin" || user?.role === "teacher") && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary"
            >
              {showForm ? "✖ Cancel" : "+ New Announcement"}
            </button>
          )}
        </div>
      </div>

      {/* Create Announcement Form */}
      {(user?.role === "admin" || user?.role === "teacher") && showForm && (
        <div className="announcement-form-card">
          <h3>
            <span className="form-icon">✏️</span> Create New Announcement
          </h3>
          <div className="form-group">
            <input
              type="text"
              className="form-input"
              placeholder="Announcement Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>
          <div className="form-group">
            <textarea
              className="form-textarea"
              placeholder="Write your announcement content here..."
              rows="4"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Target Audience</label>
              <select
                className="form-select"
                value={targetClass}
                onChange={(e) => setTargetClass(e.target.value)}
              >
                <option value="all">📢 All Classes</option>
                <option value="grade11">🎓 Grade 11 Only</option>
                <option value="teachers">👨‍🏫 Teachers Only</option>
              </select>
            </div>
            <div className="form-group form-checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                />
                <span>📌 Pin this announcement (appears at top)</span>
              </label>
            </div>
          </div>
          <div className="form-actions">
            <button onClick={createAnnouncement} className="btn-submit">
              📢 Post Announcement
            </button>
          </div>
        </div>
      )}

      {/* Announcements List */}
      <div className="announcements-list">
        <div className="list-header">
          <h3>📰 Recent Announcements</h3>
          <span className="announcement-count">
            {announcements.length} total
          </span>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading announcements...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h4>No Announcements Yet</h4>
            <p>Check back later for updates from the school administration.</p>
            {(user?.role === "admin" || user?.role === "teacher") && (
              <button onClick={() => setShowForm(true)} className="btn-primary">
                Create First Announcement
              </button>
            )}
          </div>
        ) : (
          <div className="announcements-grid">
            {announcements.map((a) => (
              <div
                key={a.id}
                className={`announcement-card ${a.pinned ? "pinned" : ""}`}
              >
                {a.pinned && <div className="pinned-badge">📌 Pinned</div>}
                <div className="announcement-card-header">
                  <h4 className="announcement-title">{a.title}</h4>
                  {(user?.role === "admin" || user?.role === "teacher") && (
                    <button
                      onClick={() => deleteAnnouncement(a.id)}
                      className="btn-delete"
                      title="Delete announcement"
                    >
                      🗑️
                    </button>
                  )}
                </div>
                <div className="announcement-meta">
                  <span className="meta-author">👤 {a.author || "Admin"}</span>
                  <span className="meta-target">
                    🎯 Target:{" "}
                    {a.targetClass === "all"
                      ? "All Classes"
                      : a.targetClass === "grade11"
                        ? "Grade 11"
                        : "Teachers"}
                  </span>
                  <span className="meta-date">
                    📅 {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="announcement-content">
                  <p>{a.content}</p>
                </div>
                <div className="announcement-footer">
                  <span className="time-ago">
                    🕒 {getTimeAgo(new Date(a.createdAt))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to show relative time
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? "" : "s"} ago`;
    }
  }
  return "just now";
}
