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

  // Set up axios interceptor
  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // ==================== SESSION CHECK ====================
  useEffect(() => {
    const checkSession = async () => {
      if (!token) return; // ← Fixed: Skip if no token

      try {
        await api.get("/api/auth/me");
      } catch (error) {
        if (error.response?.status === 401) {
          setSessionMessage("Your session has expired. Please login again.");
          setShowSessionModal(true);
          handleLogout(); // Clear invalid session
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
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
      handleLogout();
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

  return (
    <BrowserRouter>
      <Favicon emoji="📚" />

      {!token || !user ? (
        // ==================== NOT LOGGED IN ====================
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
        // ==================== LOGGED IN ====================
        <>
          <Navigation user={user} onLogout={handleLogout} />
          <div className="main-content">
            <Routes>
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

              <Route
                path="/my-portal"
                element={
                  <ProtectedRoute user={user} allowedRoles={["student"]}>
                    <StudentPortal user={user} />
                  </ProtectedRoute>
                }
              />

              <Route path="/tv" element={<TVDisplay />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
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
