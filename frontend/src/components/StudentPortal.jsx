import React, { useState, useEffect } from "react";
import api from "../api";

export default function StudentPortal({ user }) {
  const [myScores, setMyScores] = useState([]);
  const [myAttendance, setMyAttendance] = useState([]);
  const [myExamResults, setMyExamResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      // Fetch all scores and filter by student ID
      const scoresRes = await api.get("/scores");
      const studentScores = scoresRes.data.filter(
        (s) => s.studentId === user?.studentId,
      );
      setMyScores(studentScores);

      // Fetch attendance
      const attendanceRes = await api.get(
        `/attendance?studentId=${user?.studentId}`,
      );
      setMyAttendance(attendanceRes.data);

      // Fetch exam results
      const examRes = await api.get(
        `/exams/results/${user?.studentId || "STU001"}`,
      );
      setMyExamResults(examRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAverage = () => {
    if (myScores.length === 0) return 0;
    const sum = myScores.reduce((acc, s) => acc + s.score, 0);
    return (sum / myScores.length).toFixed(1);
  };

  const calculateAttendanceRate = () => {
    if (myAttendance.length === 0) return 0;
    const presentCount = myAttendance.filter(
      (a) => a.status === "present",
    ).length;
    return ((presentCount / myAttendance.length) * 100).toFixed(1);
  };

  if (loading) return <div>Loading your data...</div>;

  return (
    <div className="container">
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, #1e466e 0%, #2c7da0 100%)",
          color: "white",
        }}
      >
        <h1>👤 My Student Portal</h1>
        <p>Welcome, {user?.fullName || user?.username}!</p>
        <p>Student ID: {user?.studentId || "Not assigned"}</p>
      </div>

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
          <h3>📊 Average Score</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#2c7da0" }}>
            {calculateAverage()}%
          </p>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <h3>📋 Attendance Rate</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#2c7da0" }}>
            {calculateAttendanceRate()}%
          </p>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <h3>📝 Total Assessments</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#2c7da0" }}>
            {myScores.length}
          </p>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <h3>📖 Exams Taken</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#2c7da0" }}>
            {myExamResults.length}
          </p>
        </div>
      </div>

      <div className="card">
        <h2>📝 My Grades</h2>
        {myScores.length === 0 ? (
          <p>No grades recorded yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Assessment</th>
                <th>Score</th>
                <th>Grade</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {myScores.map((s) => (
                <tr key={s.id}>
                  <td>{s.assessment}</td>
                  <td>{s.score}</td>
                  <td>
                    {s.score >= 90
                      ? "A+"
                      : s.score >= 80
                        ? "A"
                        : s.score >= 70
                          ? "B"
                          : s.score >= 60
                            ? "C"
                            : s.score >= 50
                              ? "D"
                              : "F"}
                  </td>
                  <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2>📋 My Attendance History</h2>
        {myAttendance.length === 0 ? (
          <p>No attendance records yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {myAttendance.map((a) => (
                <tr key={a.id}>
                  <td>{new Date(a.date).toLocaleDateString()}</td>
                  <td>
                    {a.status === "present"
                      ? "✅ Present"
                      : a.status === "late"
                        ? "⏰ Late"
                        : "❌ Absent"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2>📖 Exam Results</h2>
        {myExamResults.length === 0 ? (
          <p>No exams taken yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Exam Title</th>
                <th>Score</th>
                <th>Submitted Date</th>
              </tr>
            </thead>
            <tbody>
              {myExamResults.map((r) => (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td>{r.score}%</td>
                  <td>{new Date(r.submittedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
