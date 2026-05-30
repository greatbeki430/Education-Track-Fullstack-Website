import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navigation({ user, onLogout }) {
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    {
      path: "/",
      label: "📊 Dashboard",
      roles: ["admin", "teacher", "student"],
    },
    { path: "/gradebook", label: "📝 Gradebook", roles: ["admin", "teacher"] },
    {
      path: "/attendance",
      label: "📋 Attendance",
      roles: ["admin", "teacher"],
    },
    {
      path: "/exams",
      label: "📖 Exams",
      roles: ["admin", "teacher", "student"],
    },
    {
      path: "/announcements",
      label: "📢 Announcements",
      roles: ["admin", "teacher", "student"],
    },
    { path: "/my-portal", label: "👤 My Portal", roles: ["student"] },
  ];

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(user?.role),
  );

  const triggerExport = (format) => {
    window.dispatchEvent(new CustomEvent("exportExam", { detail: { format } }));
    setUserMenuOpen(false);
  };

  const isOnExamPage = location.pathname.includes("/take-exam");
  const isTeacher = user?.role === "teacher" || user?.role === "admin";

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <h2>📚 EduTrack Ultimate</h2>
        <span className="school-badge">
          Meskerem Secondary School - Communities |{" "}
          {user?.role === "admin"
            ? "👑 Admin"
            : user?.role === "teacher"
              ? "👨‍🏫 Teacher"
              : "🎓 Student"}
        </span>
      </div>

      <div className="nav-links">
        {visibleItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={location.pathname === item.path ? "active" : ""}
          >
            {item.label}
          </Link>
        ))}

        <div className="user-menu" ref={menuRef}>
          <button
            className="user-menu-btn"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <span className="user-avatar">
              {user?.fullName?.charAt(0) || user?.username?.charAt(0) || "U"}
            </span>
            <span className="user-name">
              {user?.fullName?.split(" ")[0] || user?.username}
            </span>
            <span className="dropdown-arrow">▼</span>
          </button>

          {userMenuOpen && (
            <div className="user-dropdown">
              <div className="dropdown-header">
                <strong>{user?.fullName || user?.username}</strong>
                <small>
                  {user?.role === "admin"
                    ? "Administrator"
                    : user?.role === "teacher"
                      ? "Teacher"
                      : "Student"}
                </small>
              </div>
              <div className="dropdown-divider" />

              {isOnExamPage && (
                <>
                  {/* ── Teacher: Print for classroom ── */}
                  {isTeacher && (
                    <>
                      <div className="dropdown-section">
                        <div className="dropdown-label">
                          🖨️ Print for Classroom
                        </div>

                        <button
                          onClick={() => triggerExport("print-student")}
                          className="dropdown-item"
                        >
                          <span className="dropdown-item-icon">📄</span>
                          <span className="dropdown-item-body">
                            <span className="dropdown-item-title">
                              Student Exam Paper
                            </span>
                            <span className="dropdown-item-hint">
                              Questions &amp; choices — no answers
                            </span>
                          </span>
                        </button>

                        <button
                          onClick={() => triggerExport("print-teacher")}
                          className="dropdown-item"
                        >
                          <span className="dropdown-item-icon">🔑</span>
                          <span className="dropdown-item-body">
                            <span className="dropdown-item-title">
                              Teacher Answer Key
                            </span>
                            <span className="dropdown-item-hint">
                              Answers &amp; explanations · confidential
                            </span>
                          </span>
                        </button>
                      </div>
                      <div className="dropdown-divider" />
                    </>
                  )}

                  {/* ── Digital report export ── */}
                  <div className="dropdown-section">
                    <div className="dropdown-label">📥 Save Digital Report</div>

                    <button
                      onClick={() => triggerExport("pdf")}
                      className="dropdown-item"
                    >
                      <span className="dropdown-item-icon">📑</span>
                      <span className="dropdown-item-body">
                        <span className="dropdown-item-title">
                          Export as PDF
                        </span>
                        <span className="dropdown-item-hint">
                          Questions, your answers &amp; results
                        </span>
                      </span>
                    </button>

                    <button
                      onClick={() => triggerExport("word")}
                      className="dropdown-item"
                    >
                      <span className="dropdown-item-icon">📝</span>
                      <span className="dropdown-item-body">
                        <span className="dropdown-item-title">
                          Export as Word
                        </span>
                        <span className="dropdown-item-hint">
                          Editable .doc file
                        </span>
                      </span>
                    </button>
                  </div>
                  <div className="dropdown-divider" />
                </>
              )}

              <button onClick={onLogout} className="dropdown-item logout-item">
                <span className="dropdown-item-icon">🚪</span>
                <span className="dropdown-item-body">
                  <span className="dropdown-item-title">Logout</span>
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
