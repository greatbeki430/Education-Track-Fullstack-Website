import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import api from "./api";
import Navigation from "./components/Navigation";
import Dashboard from "./components/Dashboard";
import Gradebook from "./components/Gradebook";
import Attendance from "./components/Attendance";
import Exams from "./components/Exams";
import TakeExam from "./components/TakeExam";
import Announcements from "./components/Announcements";
import StudentPortal from "./components/StudentPortal";
import Login from "./components/Login";
import TVDisplay from "./components/TVDisplay";
import "./styles/index.css";

// Protected Route Component
function ProtectedRoute({ children, allowedRoles, user }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "null"),
  );

  // Set up axios interceptor for authentication
  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, [token]);

  const handleLogin = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
  };

  // If not logged in, show login page
  if (!token || !user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <div className="app">
        <Navigation user={user} onLogout={handleLogout} />
        <div className="main-content">
          <Routes>
            {/* Dashboard - all roles */}
            <Route
              path="/"
              element={
                <ProtectedRoute
                  user={user}
                  allowedRoles={["admin", "teacher", "student"]}
                >
                  <Dashboard user={user} />
                </ProtectedRoute>
              }
            />

            {/* Gradebook - admin and teacher only */}
            <Route
              path="/gradebook"
              element={
                <ProtectedRoute user={user} allowedRoles={["admin", "teacher"]}>
                  <Gradebook />
                </ProtectedRoute>
              }
            />

            {/* Attendance - admin and teacher only */}
            <Route
              path="/attendance"
              element={
                <ProtectedRoute user={user} allowedRoles={["admin", "teacher"]}>
                  <Attendance />
                </ProtectedRoute>
              }
            />

            {/* Exams - all roles */}
            <Route
              path="/exams"
              element={
                <ProtectedRoute
                  user={user}
                  allowedRoles={["admin", "teacher", "student"]}
                >
                  <Exams user={user} />
                </ProtectedRoute>
              }
            />

            {/* Take Exam - all roles */}
            <Route
              path="/take-exam/:id"
              element={
                <ProtectedRoute
                  user={user}
                  allowedRoles={["admin", "teacher", "student"]}
                >
                  <TakeExam user={user} />
                </ProtectedRoute>
              }
            />

            {/* Announcements - all roles */}
            <Route
              path="/announcements"
              element={
                <ProtectedRoute
                  user={user}
                  allowedRoles={["admin", "teacher", "student"]}
                >
                  <Announcements user={user} />
                </ProtectedRoute>
              }
            />

            {/* Student Portal - students only */}
            <Route
              path="/my-portal"
              element={
                <ProtectedRoute user={user} allowedRoles={["student"]}>
                  <StudentPortal user={user} />
                </ProtectedRoute>
              }
            />

            <Route path="/tv" element={<TVDisplay />} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
