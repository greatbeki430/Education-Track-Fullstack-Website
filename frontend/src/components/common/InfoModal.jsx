import React, { useEffect } from "react";

export default function InfoModal({
  isOpen,
  onClose,
  title,
  message,
  type = "info", // info, success, error, warning
  autoClose = 0, // Auto close in milliseconds (0 = disabled)
}) {
  useEffect(() => {
    if (isOpen && autoClose > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      default:
        return "ℹ️";
    }
  };

  const getHeaderColor = () => {
    switch (type) {
      case "success":
        return "#4caf50";
      case "error":
        return "#f44336";
      case "warning":
        return "#ff9800";
      default:
        return "#2c7da0";
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          width: "90%",
          maxWidth: "400px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          animation: "slideUp 0.3s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "20px 24px",
            borderBottom: `3px solid ${getHeaderColor()}`,
            background: "#fafafa",
          }}
        >
          <span style={{ fontSize: "24px" }}>{getIcon()}</span>
          <h3 style={{ flex: 1, margin: 0, fontSize: "18px", color: "#333" }}>
            {title}
          </h3>
          <button
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#999",
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.target.style.background = "#f0f0f0";
              e.target.style.color = "#333";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "none";
              e.target.style.color = "#999";
            }}
          >
            ✖
          </button>
        </div>
        <div
          style={{
            padding: "24px",
            lineHeight: "1.6",
            color: "#555",
            whiteSpace: "pre-line",
          }}
        >
          <p>{message}</p>
        </div>
        <div
          style={{
            padding: "16px 24px",
            background: "#fafafa",
            borderTop: "1px solid #e0e0e0",
          }}
        >
          <button
            style={{
              width: "100%",
              padding: "12px",
              background: getHeaderColor(),
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.filter = "brightness(1.05)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.filter = "none";
            }}
          >
            OK
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
