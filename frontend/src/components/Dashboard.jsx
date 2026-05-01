import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function Dashboard({ user }) {
  const [stats, setStats] = useState({
    totalStudents: 0,
    averageScore: 0,
    totalAssessments: 0,
    totalRecords: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/scores");
      const scores = res.data;
      setStats({
        totalStudents: new Set(scores.map((s) => s.studentId)).size,
        averageScore: scores.length
          ? (
              scores.reduce((sum, s) => sum + s.score, 0) / scores.length
            ).toFixed(1)
          : 0,
        totalAssessments: new Set(scores.map((s) => s.assessment)).size,
        totalRecords: scores.length,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const quickActions = [
    {
      title: "📝 Manage Grades",
      path: "/gradebook",
      color: "#2c7da0",
      roles: ["admin", "teacher"],
    },
    {
      title: "📋 Take Attendance",
      path: "/attendance",
      color: "#61a5c2",
      roles: ["admin", "teacher"],
    },
    {
      title: "📖 Online Exams",
      path: "/exams",
      color: "#89c2d9",
      roles: ["admin", "teacher", "student"],
    },
    {
      title: "📢 Announcements",
      path: "/announcements",
      color: "#a9d6e5",
      roles: ["admin", "teacher", "student"],
    },
    {
      title: "👤 My Portal",
      path: "/my-portal",
      color: "#01497c",
      roles: ["student"],
    },
  ];

  const visibleActions = quickActions.filter((action) =>
    action.roles.includes(user?.role),
  );

  return (
    <div className="container">
      {/* Welcome Section */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, #1e466e 0%, #2c7da0 100%)",
          color: "white",
        }}
      >
        <h1>👋 Welcome back, {user?.fullName || user?.username}!</h1>
        <p>
          Role:{" "}
          {user?.role === "admin"
            ? "School Administrator"
            : user?.role === "teacher"
              ? "Teacher"
              : "Student"}
        </p>
        <p>
          Today is{" "}
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats Overview */}
      <div
        className="stats-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div className="card" style={{ textAlign: "center" }}>
          <h3>📊 Total Students</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#2c7da0" }}>
            {stats.totalStudents}
          </p>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <h3>📈 Class Average</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#2c7da0" }}>
            {stats.averageScore}%
          </p>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <h3>📝 Assessments</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#2c7da0" }}>
            {stats.totalAssessments}
          </p>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <h3>📚 Total Records</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#2c7da0" }}>
            {stats.totalRecords}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2>🚀 Quick Actions</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginTop: "1rem",
          }}
        >
          {visibleActions.map((action, idx) => (
            <Link key={idx} to={action.path} style={{ textDecoration: "none" }}>
              <div
                style={{
                  background: action.color,
                  color: "white",
                  padding: "1.5rem",
                  borderRadius: "12px",
                  textAlign: "center",
                  transition: "transform 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-5px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                  {action.title.split(" ")[0]}
                </div>
                <div style={{ fontWeight: "bold" }}>{action.title}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Tips Section */}
      <div className="card">
        <h2>💡 Quick Tips</h2>
        <ul style={{ marginLeft: "1.5rem", lineHeight: "1.8" }}>
          <li>
            📊 Use the <strong>Gradebook</strong> to add student scores and
            generate reports
          </li>
          <li>
            📋 The <strong>Attendance</strong> tracker helps you monitor daily
            student presence
          </li>
          <li>
            📖 Create <strong>Online Exams</strong> with automatic timers for
            absent students
          </li>
          <li>
            📢 Post <strong>Announcements</strong> to keep everyone informed
          </li>
          <li>
            📑 Export any data to <strong>PDF, Excel, Word, or CSV</strong> with
            one click
          </li>
        </ul>
      </div>
    </div>
  );
}
