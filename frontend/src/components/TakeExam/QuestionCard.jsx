import React from "react";
import { stripHtmlTags } from "../../utils/examUtils";

export default function QuestionCard({
  question,
  index,
  answer,
  isMarked,
  onAnswerChange,
  onToggleMark,
  onNavigate,
  currentIndex,
  totalQuestions,
  onOpenSubmitModal, // New prop for submit modal
}) {
  if (!question) return null;

  const isLastQuestion = currentIndex === totalQuestions - 1;

  return (
    <div
      style={{
        background: "white",
        borderRadius: "16px",
        padding: "30px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          paddingBottom: "15px",
          borderBottom: "2px solid #f0f0f0",
        }}
      >
        <div style={{ fontSize: "18px", fontWeight: "bold", color: "#2c7da0" }}>
          Question {index + 1} of {totalQuestions}
          <span
            style={{
              fontSize: "14px",
              color: "#666",
              marginLeft: "10px",
              fontWeight: "normal",
            }}
          >
            ({question.points} {question.points === 1 ? "point" : "points"})
          </span>
        </div>
        <button
          style={{
            padding: "6px 12px",
            background: isMarked ? "#fff3e0" : "#f5f5f5",
            border: isMarked ? "1px solid #ff9800" : "1px solid #ddd",
            borderRadius: "20px",
            cursor: "pointer",
            fontSize: "14px",
            color: isMarked ? "#ff9800" : "#666",
          }}
          onClick={() => onToggleMark(index)}
        >
          🚩 {isMarked ? "Marked" : "Mark"}
        </button>
      </div>

      <div
        style={{
          fontSize: "20px",
          lineHeight: 1.5,
          marginBottom: "25px",
          color: "#333",
        }}
      >
        {stripHtmlTags(question.text)}
      </div>

      <div style={{ marginBottom: "30px" }}>
        {question.type === "multiple-choice" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {question.options.map((opt, optIdx) => (
              <label
                key={optIdx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 15px",
                  background: answer === opt ? "#e3f2fd" : "#f8f9fa",
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  border:
                    answer === opt
                      ? "2px solid #2c7da0"
                      : "2px solid transparent",
                }}
              >
                <input
                  type="radio"
                  name={`question-${index}`}
                  value={opt}
                  checked={answer === opt}
                  onChange={(e) => onAnswerChange(index, e.target.value)}
                  style={{
                    marginRight: "12px",
                    width: "18px",
                    height: "18px",
                    cursor: "pointer",
                  }}
                />
                <span style={{ flex: 1 }}>{opt}</span>
                {answer === opt && <span style={{ color: "#2c7da0" }}>✓</span>}
              </label>
            ))}
          </div>
        )}

        {question.type === "true-false" && (
          <div style={{ display: "flex", gap: "20px" }}>
            <label
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px 15px",
                background: answer === "True" ? "#e8f5e9" : "#f8f9fa",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "all 0.2s",
                border:
                  answer === "True"
                    ? "2px solid #4caf50"
                    : "2px solid transparent",
              }}
            >
              <input
                type="radio"
                name={`question-${index}`}
                value="True"
                checked={answer === "True"}
                onChange={(e) => onAnswerChange(index, e.target.value)}
                style={{ marginRight: "12px", cursor: "pointer" }}
              />
              <span>✅ True</span>
            </label>
            <label
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px 15px",
                background: answer === "False" ? "#ffebee" : "#f8f9fa",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "all 0.2s",
                border:
                  answer === "False"
                    ? "2px solid #f44336"
                    : "2px solid transparent",
              }}
            >
              <input
                type="radio"
                name={`question-${index}`}
                value="False"
                checked={answer === "False"}
                onChange={(e) => onAnswerChange(index, e.target.value)}
                style={{ marginRight: "12px", cursor: "pointer" }}
              />
              <span>❌ False</span>
            </label>
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: "15px",
          marginTop: "30px",
          paddingTop: "20px",
          borderTop: "1px solid #e0e0e0",
        }}
      >
        <button
          style={{
            flex: 1,
            padding: "12px",
            background: currentIndex === 0 ? "#ccc" : "#2c7da0",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: currentIndex === 0 ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
          onClick={() => onNavigate(currentIndex - 1)}
          disabled={currentIndex === 0}
        >
          ← Previous
        </button>

        {!isLastQuestion ? (
          <button
            style={{
              flex: 1,
              padding: "12px",
              background: "#2c7da0",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onClick={() => onNavigate(currentIndex + 1)}
          >
            Next →
          </button>
        ) : (
          <button
            style={{
              flex: 1,
              padding: "12px",
              background: "linear-gradient(135deg, #4caf50, #45a049)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 2px 8px rgba(76, 175, 80, 0.3)",
            }}
            onClick={onOpenSubmitModal}
          >
            📤 Submit Exam
          </button>
        )}
      </div>

      {/* Last question indicator */}
      {isLastQuestion && (
        <div
          style={{
            marginTop: "20px",
            padding: "12px",
            background: "#e8f5e9",
            borderRadius: "8px",
            textAlign: "center",
            color: "#4caf50",
            fontSize: "14px",
          }}
        >
          🎯 This is the last question. Click "Submit Exam" when you're ready.
        </div>
      )}
    </div>
  );
}
