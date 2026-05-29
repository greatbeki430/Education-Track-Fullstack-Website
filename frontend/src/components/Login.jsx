import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import InfoModal from "./common/InfoModal";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/api/auth/login", { username, password });
      onLogin(res.data.token, res.data.user);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.error ||
          "Login failed. Please check your credentials.",
      );
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div
      className="login-container"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1e466e 0%, #2c7da0 100%)",
        position: "relative",
      }}
    >
      {/* ============ ADD BACK TO HOME BUTTON (TOP LEFT) ============ */}
      <Link
        to="/"
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          background: "rgba(255,255,255,0.2)",
          backdropFilter: "blur(10px)",
          color: "white",
          textDecoration: "none",
          padding: "0.6rem 1.2rem",
          borderRadius: "30px",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.9rem",
          fontWeight: "500",
          transition: "all 0.3s ease",
          border: "1px solid rgba(255,255,255,0.3)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.3)";
          e.currentTarget.style.transform = "translateX(-5px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.2)";
          e.currentTarget.style.transform = "translateX(0)";
        }}
      >
        <span style={{ fontSize: "1.2rem" }}>←</span> Back to Home
      </Link>

      <div
        className="login-card"
        style={{
          background: "white",
          padding: "2rem",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "400px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          animation: "fadeInUp 0.5s ease",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ color: "#1e466e", marginBottom: "0.5rem" }}>
            📚 EduTrack Ultimate
          </h1>
          <p style={{ color: "#666" }}>Meskerem Secondary School Communities</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "600",
                color: "#333",
              }}
            >
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "8px",
                border: "1px solid #ddd",
                fontSize: "1rem",
                transition: "all 0.3s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#2c7da0";
                e.target.style.outline = "none";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#ddd";
              }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "600",
                color: "#333",
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  paddingRight: "3rem",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  fontSize: "1rem",
                  transition: "all 0.3s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#2c7da0";
                  e.target.style.outline = "none";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#ddd";
                }}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                  color: "#666",
                  padding: "0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                color: "red",
                marginBottom: "1rem",
                textAlign: "center",
                fontSize: "0.9rem",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: loading
                ? "#ccc"
                : "linear-gradient(135deg, #2c7da0, #1e466e)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 5px 15px rgba(44, 125, 160, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "none";
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div
          style={{
            marginTop: "1.5rem",
            textAlign: "center",
            fontSize: "0.8rem",
            color: "#666",
          }}
        >
          <p>Demo Credentials:</p>
          <p
            style={{
              background: "#f0f0f0",
              padding: "0.5rem",
              borderRadius: "8px",
            }}
          >
            📝 Username: <strong>admin</strong> | Password:{" "}
            <strong>admin123</strong>
          </p>
        </div>

        {/* ============ ADD BACK TO HOME LINK AT BOTTOM (OPTIONAL) ============ */}
        <div
          style={{
            marginTop: "1rem",
            textAlign: "center",
            borderTop: "1px solid #eee",
            paddingTop: "1rem",
          }}
        >
          <Link
            to="/"
            style={{
              color: "#2c7da0",
              textDecoration: "none",
              fontSize: "0.85rem",
              transition: "color 0.3s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ffb74d";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#2c7da0";
            }}
          >
            ← Return to Homepage
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <InfoModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        type="error"
        title="Login Failed"
        message={errorMessage}
      />
    </div>
  );
}
