import React from "react";

const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function ExamHeader({ title, description, timeLeft }) {
  const getTimerColor = () => {
    if (timeLeft < 60) return "#f44336";
    if (timeLeft < 300) return "#ff9800";
    return "#4caf50";
  };

  return (
    <div
      style={{
        background: "white",
        borderRadius: "16px",
        padding: "25px",
        marginBottom: "25px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "20px",
      }}
    >
      <div>
        <h1
          style={{ color: "#1e466e", marginBottom: "10px", fontSize: "28px" }}
        >
          {title}
        </h1>
        {description && (
          <p style={{ color: "#666", lineHeight: 1.6 }}>{description}</p>
        )}
      </div>
      <div
        style={{
          textAlign: "center",
          padding: "15px 25px",
          borderRadius: "12px",
          background: "#f8f9fa",
          minWidth: "150px",
        }}
      >
        <div style={{ fontSize: "24px" }}>⏰</div>
        <div
          style={{
            fontSize: "32px",
            fontWeight: "bold",
            fontFamily: "monospace",
            color: getTimerColor(),
          }}
        >
          {formatTime(timeLeft)}
        </div>
        <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
          Time Remaining
        </div>
      </div>
    </div>
  );
}
