import React, { useState, useRef } from "react";
import api from "../api";
import InfoModal from "./common/InfoModal";
import "./AIExamGenerator.css";

const DEFAULT_TYPE_CONFIG = {
  "multiple-choice": { enabled: true, count: 5, points: 2 },
  "true-false": { enabled: true, count: 5, points: 1 },
};

export default function AIExamGenerator({ onQuestionsGenerated, onClose }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [typeConfig, setTypeConfig] = useState(DEFAULT_TYPE_CONFIG);
  const [config, setConfig] = useState({
    gradeLevel: 11,
    customGradeLevel: "",
    difficulty: "medium",
    customInstructions: "",
  });
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [error, setError] = useState("");
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalConfig, setInfoModalConfig] = useState({});

  const fileInputRef = useRef(null);

  const enabledTypes = Object.entries(typeConfig)
    .filter(([, v]) => v.enabled)
    .map(([k]) => k);

  const totalQuestions = Object.values(typeConfig)
    .filter((v) => v.enabled)
    .reduce((s, v) => s + (parseInt(v.count) || 0), 0);

  const totalPoints = Object.values(typeConfig)
    .filter((v) => v.enabled)
    .reduce(
      (s, v) => s + (parseInt(v.count) || 0) * (parseInt(v.points) || 1),
      0,
    );

  const updateTypeConfig = (type, field, value) => {
    setTypeConfig((prev) => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
  };

  const handleGradeLevelChange = (value) => {
    if (value === "custom") {
      setConfig((prev) => ({ ...prev, gradeLevel: "custom" }));
    } else {
      setConfig((prev) => ({
        ...prev,
        gradeLevel: parseInt(value),
        customGradeLevel: "",
      }));
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a PDF, DOCX, or TXT file.");
      return;
    }
    setSelectedFile(file);
    setError("");
  };

  const generateQuestions = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }
    if (enabledTypes.length === 0) {
      setError("Please enable at least one question type.");
      return;
    }
    if (totalQuestions < 1) {
      setError("Total number of questions must be at least 1.");
      return;
    }

    let finalGradeLevel = config.gradeLevel;
    if (config.gradeLevel === "custom") {
      finalGradeLevel = parseInt(config.customGradeLevel);
      if (isNaN(finalGradeLevel) || finalGradeLevel < 1) {
        setError("Please enter a valid grade level.");
        return;
      }
    }

    setLoading(true);
    setError("");

    const typeBreakdown = Object.entries(typeConfig)
      .filter(([, v]) => v.enabled && parseInt(v.count) > 0)
      .map(([type, v]) => ({
        type: type, // This tells the backend what type of questions to generate
        count: parseInt(v.count),
        points: parseInt(v.points) || 1,
      }));

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("numQuestions", totalQuestions);
    formData.append("gradeLevel", finalGradeLevel);
    formData.append("difficulty", config.difficulty);
    formData.append("questionTypes", JSON.stringify(enabledTypes));
    formData.append("typeBreakdown", JSON.stringify(typeBreakdown));
    formData.append("customInstructions", config.customInstructions);

    try {
      const response = await api.post("/api/ai/generate-from-file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });

      // Ensure questions have the correct type based on what was requested
      const stamped = (response.data.questions || []).map((q, idx) => {
        // Determine which type this question belongs to based on the breakdown
        let assignedType = "multiple-choice";
        let typeIndex = 0;

        for (const breakdown of typeBreakdown) {
          if (idx < typeIndex + breakdown.count) {
            assignedType = breakdown.type;
            break;
          }
          typeIndex += breakdown.count;
        }

        return {
          ...q,
          type: assignedType, // Force the type based on user selection
          points: typeConfig[assignedType]?.points || q.points || 1,
        };
      });

      setGeneratedQuestions(stamped);
      setStep(2);
      setCurrentQuestionIndex(0);
    } catch (err) {
      console.error("Generation error:", err);
      setInfoModalConfig({
        type: "error",
        title: "Generation Failed",
        message:
          err.response?.data?.error ||
          "Failed to generate questions. Please try again.",
      });
      setShowInfoModal(true);
    } finally {
      setLoading(false);
    }
  };

  const confirmQuestion = () => {
    if (currentQuestionIndex + 1 < generatedQuestions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      onQuestionsGenerated(generatedQuestions);
    }
  };

  const rejectQuestion = async () => {
    const currentQuestion = generatedQuestions[currentQuestionIndex];

    try {
      await api.post("/api/ai/save-rejected", {
        question: currentQuestion,
        reason: "Rejected by teacher during review",
        sourceContent: currentQuestion.sourceContext,
        topic: currentQuestion.topic || "General",
        gradeLevel: config.gradeLevel,
      });
    } catch (err) {
      console.error("Failed to save rejected question", err);
    }

    setLoading(true);
    try {
      const response = await api.post("/api/ai/generate-replacement", {
        originalQuestion: currentQuestion,
        sourceContent: currentQuestion.sourceContext,
        customInstructions: config.customInstructions,
        gradeLevel: config.gradeLevel,
        difficulty: config.difficulty,
        questionType: currentQuestion.type, // Pass the expected type
      });

      const replacement = {
        ...response.data.question,
        type: currentQuestion.type, // Preserve the original type
        points: currentQuestion.points,
      };

      const updated = [...generatedQuestions];
      updated[currentQuestionIndex] = replacement;
      setGeneratedQuestions(updated);
    } catch (err) {
      setError("Failed to generate replacement question. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getQuestionTypeLabel = (type) =>
    type === "multiple-choice" ? "Multiple Choice" : "True / False";

  // Render question based on its actual type
  const renderQuestionPreview = (question) => {
    const isTrueFalse =
      question.type === "true-false" || question.type === "true/false";

    if (isTrueFalse) {
      // True/False: Show with blanks for students to write on
      return (
        <div className="tf-preview-container">
          <div className="tf-print-options">
            <div className="tf-print-option">
              <span className="tf-print-blank">__________</span>
              <span className="tf-print-label">True</span>
            </div>
            <div className="tf-print-option">
              <span className="tf-print-blank">__________</span>
              <span className="tf-print-label">False</span>
            </div>
          </div>
          <div className="answer-section">
            <span className="answer-label">✓ Correct Answer:</span>
            <span className="answer-value">{question.correctAnswer}</span>
          </div>
        </div>
      );
    }

    // Multiple Choice: Show with bubbles
    return (
      <>
        <div className="options-list">
          {(question.options || []).map((opt, idx) => (
            <div
              key={idx}
              className={`option-item ${opt === question.correctAnswer ? "option-correct" : ""}`}
            >
              <span className="option-letter">
                {String.fromCharCode(65 + idx)}.
              </span>
              <span className="option-bubble-preview"></span>
              <span className="option-text">{opt}</span>
              {opt === question.correctAnswer && (
                <span className="option-tick">✓</span>
              )}
            </div>
          ))}
        </div>
        <div className="answer-section">
          <span className="answer-label">✓ Correct Answer:</span>
          <span className="answer-value">{question.correctAnswer}</span>
        </div>
      </>
    );
  };

  const currentQ = generatedQuestions[currentQuestionIndex];

  return (
    <div className="ai-exam-generator">
      <div className="ai-generator-modal">
        <div className="modal-header">
          <div className="modal-header-left">
            <span className="modal-icon">🤖</span>
            <div>
              <h2>AI Exam Generator</h2>
              <p>Upload source material and configure your exam structure</p>
            </div>
          </div>
          <button onClick={onClose} className="close-btn">
            ✕
          </button>
        </div>

        {/* STEP 1: CONFIG */}
        {step === 1 && (
          <div className="step-config">
            <section className="config-section">
              <h3 className="section-title">📄 Source Material</h3>
              <div
                className={`file-drop-zone ${selectedFile ? "has-file" : ""}`}
                onClick={() => fileInputRef.current.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf,.docx,.txt"
                  style={{ display: "none" }}
                />
                {selectedFile ? (
                  <div className="file-selected">
                    <span className="file-icon">📎</span>
                    <span className="file-name-text">{selectedFile.name}</span>
                    <button
                      className="file-clear-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        fileInputRef.current.value = "";
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="file-prompt">
                    <span className="file-prompt-icon">📁</span>
                    <span className="file-prompt-text">
                      Click to upload a file
                    </span>
                    <small>PDF, DOCX, or TXT</small>
                  </div>
                )}
              </div>
            </section>

            <section className="config-section">
              <h3 className="section-title">📝 Question Structure</h3>
              <p className="section-hint">
                Select question types. Each type will generate questions in its
                own format.
              </p>

              <div className="type-config-table">
                <div className="type-config-header">
                  <span>Type</span>
                  <span>Include</span>
                  <span>Questions</span>
                  <span>Points each</span>
                  <span>Format</span>
                </div>

                {/* Multiple Choice row */}
                <div
                  className={`type-config-row ${typeConfig["multiple-choice"].enabled ? "enabled" : "disabled"}`}
                >
                  <div className="type-label">
                    <span className="type-dot mc-dot"></span>
                    Multiple Choice
                  </div>
                  <div className="type-toggle">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={typeConfig["multiple-choice"].enabled}
                        onChange={(e) =>
                          updateTypeConfig(
                            "multiple-choice",
                            "enabled",
                            e.target.checked,
                          )
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="type-count">
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={typeConfig["multiple-choice"].count}
                      disabled={!typeConfig["multiple-choice"].enabled}
                      onChange={(e) =>
                        updateTypeConfig(
                          "multiple-choice",
                          "count",
                          e.target.value,
                        )
                      }
                    />
                    <span className="input-unit">questions</span>
                  </div>
                  <div className="type-points">
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={typeConfig["multiple-choice"].points}
                      disabled={!typeConfig["multiple-choice"].enabled}
                      onChange={(e) =>
                        updateTypeConfig(
                          "multiple-choice",
                          "points",
                          e.target.value,
                        )
                      }
                    />
                    <span className="input-unit">pts</span>
                  </div>
                  <div className="type-format">A, B, C, D with ○ bubbles</div>
                </div>

                {/* True / False row */}
                <div
                  className={`type-config-row ${typeConfig["true-false"].enabled ? "enabled" : "disabled"}`}
                >
                  <div className="type-label">
                    <span className="type-dot tf-dot"></span>
                    True / False
                  </div>
                  <div className="type-toggle">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={typeConfig["true-false"].enabled}
                        onChange={(e) =>
                          updateTypeConfig(
                            "true-false",
                            "enabled",
                            e.target.checked,
                          )
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="type-count">
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={typeConfig["true-false"].count}
                      disabled={!typeConfig["true-false"].enabled}
                      onChange={(e) =>
                        updateTypeConfig("true-false", "count", e.target.value)
                      }
                    />
                    <span className="input-unit">questions</span>
                  </div>
                  <div className="type-points">
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={typeConfig["true-false"].points}
                      disabled={!typeConfig["true-false"].enabled}
                      onChange={(e) =>
                        updateTypeConfig("true-false", "points", e.target.value)
                      }
                    />
                    <span className="input-unit">pts</span>
                  </div>
                  <div className="type-format">
                    __________ True / __________ False
                  </div>
                </div>

                <div className="type-config-totals">
                  <span>Total</span>
                  <span></span>
                  <span>{totalQuestions} questions</span>
                  <span></span>
                  <span className="totals-pts">{totalPoints} pts</span>
                </div>
              </div>
            </section>

            <section className="config-section">
              <h3 className="section-title">⚙️ Exam Settings</h3>
              <div className="settings-row">
                <div className="settings-field">
                  <label>📖 Grade Level</label>
                  <select
                    value={config.gradeLevel}
                    onChange={(e) => handleGradeLevelChange(e.target.value)}
                  >
                    <option value={9}>Grade 9</option>
                    <option value={10}>Grade 10</option>
                    <option value={11}>Grade 11</option>
                    <option value={12}>Grade 12</option>
                    <option value="custom">Custom…</option>
                  </select>
                  {config.gradeLevel === "custom" && (
                    <input
                      type="number"
                      className="custom-inline"
                      placeholder="Grade number"
                      value={config.customGradeLevel}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          customGradeLevel: e.target.value,
                        }))
                      }
                    />
                  )}
                </div>
                <div className="settings-field">
                  <label>🎯 Difficulty</label>
                  <select
                    value={config.difficulty}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        difficulty: e.target.value,
                      }))
                    }
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div className="settings-field full-width">
                <label>
                  📋 Custom Instructions{" "}
                  <span className="optional">(optional)</span>
                </label>
                <textarea
                  rows="3"
                  placeholder="e.g., Focus on vocabulary, include questions about dates..."
                  value={config.customInstructions}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      customInstructions: e.target.value,
                    }))
                  }
                />
              </div>
            </section>

            {error && <div className="error-banner">❌ {error}</div>}

            <div className="modal-actions">
              <button onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={generateQuestions}
                className="btn-primary"
                disabled={loading || !selectedFile || totalQuestions < 1}
              >
                {loading ? "✨ Generating…" : "🚀 Generate Questions"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: REVIEW */}
        {step === 2 && currentQ && (
          <div className="step-review">
            <div className="review-progress">
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${((currentQuestionIndex + 1) / generatedQuestions.length) * 100}%`,
                  }}
                />
              </div>
              <div className="progress-label">
                <span>
                  Reviewing question {currentQuestionIndex + 1} of{" "}
                  {generatedQuestions.length}
                </span>
                <span className="progress-pts-badge">
                  {currentQ.points} pt{currentQ.points !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <div className="question-review-card">
              <div className="qrc-badges">
                <span
                  className={`type-badge ${currentQ.type === "multiple-choice" ? "badge-mc" : "badge-tf"}`}
                >
                  {getQuestionTypeLabel(currentQ.type)}
                </span>
                <span className="points-badge">
                  {currentQ.points} pt{currentQ.points !== 1 ? "s" : ""}
                </span>
              </div>

              <p className="question-text">{currentQ.text}</p>

              {renderQuestionPreview(currentQ)}

              {currentQ.explanation && (
                <div className="explanation-section">
                  <span className="explanation-label">💡 Explanation:</span>
                  <span>{currentQ.explanation}</span>
                </div>
              )}

              <div className="review-actions">
                <button
                  onClick={rejectQuestion}
                  className="btn-reject"
                  disabled={loading}
                >
                  {loading
                    ? "⟳ Generating replacement..."
                    : "❌ Reject & Replace"}
                </button>
                <button
                  onClick={confirmQuestion}
                  className="btn-confirm"
                  disabled={loading}
                >
                  {currentQuestionIndex + 1 === generatedQuestions.length
                    ? "✅ Confirm All & Save"
                    : "✓ Accept & Next →"}
                </button>
              </div>
            </div>

            <div className="question-strip">
              {generatedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  className={`strip-btn ${idx === currentQuestionIndex ? "strip-active" : ""} ${q.type === "multiple-choice" ? "strip-mc" : "strip-tf"}`}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  title={`Q${idx + 1} — ${getQuestionTypeLabel(q.type)} (${q.points} pt)`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        {...infoModalConfig}
      />
    </div>
  );
}
