import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import api from "./api";
import HomePage from "./components/HomePage";
import Navigation from "./components/Navigation";
import Dashboard from "./components/Dashboard";
import Gradebook from "./components/Gradebook";
import Attendance from "./components/Attendance";
import Exams from "./components/Exams";
import TakeExam from "./components/TakeExam/TakeExam";
import Announcements from "./components/Announcements";
import StudentPortal from "./components/StudentPortal";
import Login from "./components/Login";
import TVDisplay from "./components/TVDisplay";
import InfoModal from "./components/common/InfoModal";
import Favicon from "./components/Common/Favicon";
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
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionMessage, setSessionMessage] = useState("");

  // Set up axios interceptor for authentication
  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Add this useEffect in App component
  useEffect(() => {
    const checkSession = async () => {
      if (token) {
        try {
          await api.get("/api/auth/me");
        } catch (error) {
          if (error.response?.status === 401) {
            // Token expired
            setSessionMessage("Your session has expired. Please login again.");
            setShowSessionModal(true);
            setToken(null);
            setUser(null);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }
        }
      }
    };

    // Check session when page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Periodic session check every 5 minutes
    const interval = setInterval(checkSession, 5 * 60 * 1000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [token]);

  // Listen for token expiration events
  useEffect(() => {
    const handleTokenExpired = (event) => {
      setSessionMessage(
        event.detail.message || "Your session has expired. Please login again.",
      );
      setShowSessionModal(true);
      // Clear state
      setToken(null);
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      delete api.defaults.headers.common["Authorization"];
    };

    window.addEventListener("auth:token-expired", handleTokenExpired);

    return () => {
      window.removeEventListener("auth:token-expired", handleTokenExpired);
    };
  }, []);

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

  // ============ CHANGE 1: WRAP EVERYTHING IN BROWSERROUTER ============
  return (
    <BrowserRouter>
      <Favicon emoji="📚" />
      {/* ============ CHANGE 2: SHOW HOMEPAGE WHEN NOT LOGGED IN ============ */}
      {!token || !user ? (
        // NOT LOGGED IN - Show HomePage and Login routes
        <>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/tv" element={<TVDisplay />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <InfoModal
            isOpen={showSessionModal}
            onClose={() => {
              setShowSessionModal(false);
              window.location.href = "/login";
            }}
            type="warning"
            title="Session Expired"
            message={sessionMessage}
          />
        </>
      ) : (
        // LOGGED IN - Show protected routes
        <>
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
                  <ProtectedRoute
                    user={user}
                    allowedRoles={["admin", "teacher"]}
                  >
                    <Gradebook />
                  </ProtectedRoute>
                }
              />

              {/* Attendance - admin and teacher only */}
              <Route
                path="/attendance"
                element={
                  <ProtectedRoute
                    user={user}
                    allowedRoles={["admin", "teacher"]}
                  >
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

              {/* TV Display - accessible even when logged in */}
              <Route path="/tv" element={<TVDisplay />} />

              {/* Redirect /login to dashboard when already logged in */}
              <Route path="/login" element={<Navigate to="/" replace />} />

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <InfoModal
            isOpen={showSessionModal}
            onClose={() => {
              setShowSessionModal(false);
              handleLogout();
            }}
            type="warning"
            title="Session Expired"
            message={sessionMessage}
          />
        </>
      )}
    </BrowserRouter>
  );
}

export default App;
