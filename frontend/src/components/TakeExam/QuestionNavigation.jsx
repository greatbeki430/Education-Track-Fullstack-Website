import React from "react";

export default function QuestionNavigation({
  totalQuestions,
  currentIndex,
  answers,
  markedQuestions,
  onNavigate,
}) {
  const getStatus = (idx) => {
    if (answers[idx]) return "answered";
    if (markedQuestions[idx]) return "marked";
    return "unanswered";
  };

  const getStyle = (status, isActive) => ({
    aspectRatio: "1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      status === "answered"
        ? "#4caf50"
        : status === "marked"
          ? "#ff9800"
          : "white",
    color: status === "unanswered" ? "#333" : "white",
    border: isActive
      ? "2px solid #2c7da0"
      : `1px solid ${status === "unanswered" ? "#ddd" : "transparent"}`,
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "all 0.2s",
    boxShadow: isActive ? "0 0 0 2px rgba(44, 125, 160, 0.3)" : "none",
  });

  return (
    <div style={{ padding: "20px" }}>
      <h3 style={{ marginBottom: "15px", color: "#1e466e" }}>Questions</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "8px",
          marginBottom: "20px",
        }}
      >
        {Array.from({ length: totalQuestions }).map((_, idx) => (
          <button
            key={idx}
            style={getStyle(getStatus(idx), currentIndex === idx)}
            onClick={() => onNavigate(idx)}
          >
            {idx + 1}
          </button>
        ))}
      </div>
      <div
        style={{
          marginTop: "20px",
          paddingTop: "15px",
          borderTop: "1px solid #e0e0e0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
            fontSize: "12px",
          }}
        >
          <span
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "4px",
              background: "#4caf50",
            }}
          ></span>{" "}
          Answered
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
            fontSize: "12px",
          }}
        >
          <span
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "4px",
              background: "#ff9800",
            }}
          ></span>{" "}
          Marked
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
            fontSize: "12px",
          }}
        >
          <span
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "4px",
              background: "white",
              border: "1px solid #ddd",
            }}
          ></span>{" "}
          Unanswered
        </div>
      </div>
    </div>
  );
}
