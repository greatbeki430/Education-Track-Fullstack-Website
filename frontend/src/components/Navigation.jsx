import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navigation({ user, onLogout }) {
  const location = useLocation();

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

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <h2>📚 EduTrack Ultimate</h2>
        <span className="school-badge">
          Meskerem Secondary School - Grade 11 |{" "}
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
        <button onClick={onLogout} className="logout-btn">
          🚪 Logout ({user?.fullName || user?.username})
        </button>
      </div>
    </nav>
  );
}
