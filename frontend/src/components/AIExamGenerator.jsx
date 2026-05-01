import React, { useState, useRef } from "react";
import api from "../api";
import "./AIExamGenerator.css";

export default function AIExamGenerator({ onQuestionsGenerated, onClose }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [config, setConfig] = useState({
    numQuestions: 5,
    customNumQuestions: "",
    gradeLevel: 11,
    customGradeLevel: "",
    difficulty: "medium",
    questionTypes: ["multiple-choice", "true-false"],
    customInstructions: "",
  });

  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [rejectedQuestions, setRejectedQuestions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ];
      if (!validTypes.includes(file.type)) {
        setError("Please upload PDF, DOCX, or TXT file");
        return;
      }
      setSelectedFile(file);
      setError("");
    }
  };

  const handleConfigChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumQuestionsChange = (value) => {
    if (value === "custom") {
      setConfig((prev) => ({ ...prev, numQuestions: "custom" }));
    } else {
      setConfig((prev) => ({
        ...prev,
        numQuestions: parseInt(value),
        customNumQuestions: "",
      }));
    }
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

  const generateQuestions = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload");
      return;
    }

    let finalNumQuestions = config.numQuestions;
    if (config.numQuestions === "custom") {
      finalNumQuestions = parseInt(config.customNumQuestions);
      if (isNaN(finalNumQuestions) || finalNumQuestions < 1) {
        setError("Please enter a valid number of questions");
        return;
      }
    }

    let finalGradeLevel = config.gradeLevel;
    if (config.gradeLevel === "custom") {
      finalGradeLevel = parseInt(config.customGradeLevel);
      if (isNaN(finalGradeLevel) || finalGradeLevel < 1) {
        setError("Please enter a valid grade level");
        return;
      }
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("numQuestions", finalNumQuestions);
    formData.append("gradeLevel", finalGradeLevel);
    formData.append("difficulty", config.difficulty);
    formData.append("questionTypes", JSON.stringify(config.questionTypes));
    formData.append("customInstructions", config.customInstructions);

    try {
      let response;
      try {
        response = await api.post("/ai/generate-from-file", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } catch (err) {
        console.log("Using mock AI");
        response = await api.post("/ai/generate-from-file-mock", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setGeneratedQuestions(response.data.questions);
      setSessionId(response.data.sessionId);
      setStep(2);
      setCurrentQuestionIndex(0);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate questions");
    } finally {
      setLoading(false);
    }
  };

  const confirmQuestion = async () => {
    // Move to next question
    if (currentQuestionIndex + 1 < generatedQuestions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions confirmed
      onQuestionsGenerated(generatedQuestions);
    }
  };

  const rejectQuestion = async () => {
    const currentQuestion = generatedQuestions[currentQuestionIndex];

    // Save to rejected bank
    try {
      await api.post("/ai/save-rejected", {
        question: currentQuestion,
        reason: "Rejected by teacher during review",
        sourceContent: currentQuestion.sourceContent,
        topic: config.topic || "General",
        gradeLevel: config.gradeLevel,
      });
    } catch (err) {
      console.error("Failed to save rejected question");
    }

    setLoading(true);

    try {
      // Request a replacement question from AI
      const response = await api.post("/ai/generate-replacement", {
        originalQuestion: currentQuestion,
        sourceContent: currentQuestion.sourceContent,
        customInstructions: config.customInstructions,
        gradeLevel: config.gradeLevel,
        difficulty: config.difficulty,
      });

      // Replace the current question with the new one
      const updatedQuestions = [...generatedQuestions];
      updatedQuestions[currentQuestionIndex] = response.data.question;
      setGeneratedQuestions(updatedQuestions);

      // Stay on same index to review the new question
    } catch (err) {
      setError("Failed to generate replacement question. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getQuestionTypeLabel = (type) => {
    return type === "multiple-choice" ? "🔘 Multiple Choice" : "✅ True/False";
  };

  return (
    <div className="ai-exam-generator">
      <div className="ai-generator-modal">
        <div className="modal-header">
          <h2>🤖 AI Exam Generator</h2>
          <button onClick={onClose} className="close-btn">
            &times;
          </button>
        </div>

        {step === 1 && (
          <div className="step-config">
            <div className="file-upload-section">
              <h3>📄 Upload Source Material</h3>
              <div
                className="file-drop-zone"
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
                    <span>📎 {selectedFile.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                    >
                      ✖
                    </button>
                  </div>
                ) : (
                  <div className="file-prompt">
                    <span>📁 Click or drag to upload</span>
                    <small>Supports PDF, DOCX, TXT</small>
                  </div>
                )}
              </div>
            </div>

            <div className="config-section">
              <h3>⚙️ Configuration</h3>

              <div className="config-row">
                <div className="config-field">
                  <label>🔢 Number of Questions</label>
                  <select
                    value={config.numQuestions}
                    onChange={(e) => handleNumQuestionsChange(e.target.value)}
                  >
                    <option value={3}>3 questions</option>
                    <option value={5}>5 questions</option>
                    <option value={10}>10 questions</option>
                    <option value={15}>15 questions</option>
                    <option value={20}>20 questions</option>
                    <option value="custom">Custom...</option>
                  </select>
                  {config.numQuestions === "custom" && (
                    <input
                      type="number"
                      placeholder="Enter number"
                      value={config.customNumQuestions}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          customNumQuestions: e.target.value,
                        }))
                      }
                      min="1"
                      max="50"
                    />
                  )}
                </div>

                <div className="config-field">
                  <label>📖 Grade Level</label>
                  <select
                    value={config.gradeLevel}
                    onChange={(e) => handleGradeLevelChange(e.target.value)}
                  >
                    <option value={9}>Grade 9</option>
                    <option value={10}>Grade 10</option>
                    <option value={11}>Grade 11</option>
                    <option value={12}>Grade 12</option>
                    <option value="custom">Custom...</option>
                  </select>
                  {config.gradeLevel === "custom" && (
                    <input
                      type="number"
                      placeholder="Enter grade"
                      value={config.customGradeLevel}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          customGradeLevel: e.target.value,
                        }))
                      }
                      min="1"
                      max="12"
                    />
                  )}
                </div>
              </div>

              <div className="config-row">
                <div className="config-field">
                  <label>🎯 Difficulty</label>
                  <select
                    value={config.difficulty}
                    onChange={(e) =>
                      handleConfigChange("difficulty", e.target.value)
                    }
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div className="config-field">
                  <label>📝 Question Types</label>
                  <div className="checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={config.questionTypes.includes(
                          "multiple-choice",
                        )}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleConfigChange("questionTypes", [
                              ...config.questionTypes,
                              "multiple-choice",
                            ]);
                          } else {
                            handleConfigChange(
                              "questionTypes",
                              config.questionTypes.filter(
                                (t) => t !== "multiple-choice",
                              ),
                            );
                          }
                        }}
                      />
                      Multiple Choice
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={config.questionTypes.includes("true-false")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleConfigChange("questionTypes", [
                              ...config.questionTypes,
                              "true-false",
                            ]);
                          } else {
                            handleConfigChange(
                              "questionTypes",
                              config.questionTypes.filter(
                                (t) => t !== "true-false",
                              ),
                            );
                          }
                        }}
                      />
                      True/False
                    </label>
                  </div>
                </div>
              </div>

              <div className="config-field full-width">
                <label>📋 Custom Instructions (Optional)</label>
                <textarea
                  placeholder="e.g., Focus on vocabulary, Include questions about dates, Emphasize critical thinking..."
                  value={config.customInstructions}
                  onChange={(e) =>
                    handleConfigChange("customInstructions", e.target.value)
                  }
                  rows="3"
                />
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="modal-actions">
              <button onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={generateQuestions}
                className="btn-primary"
                disabled={loading}
              >
                {loading ? "✨ Generating..." : "🚀 Generate Questions"}
              </button>
            </div>
          </div>
        )}

        {step === 2 && generatedQuestions.length > 0 && (
          <div className="step-review">
            <div className="review-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${((currentQuestionIndex + 1) / generatedQuestions.length) * 100}%`,
                  }}
                />
              </div>
              <span>
                Question {currentQuestionIndex + 1} of{" "}
                {generatedQuestions.length}
              </span>
            </div>

            <div className="question-review-card">
              <div className="question-type-badge">
                {getQuestionTypeLabel(
                  generatedQuestions[currentQuestionIndex].type,
                )}
              </div>

              <h3 className="question-text">
                {generatedQuestions[currentQuestionIndex].text}
              </h3>

              {generatedQuestions[currentQuestionIndex].type ===
                "multiple-choice" && (
                <div className="options-list">
                  {generatedQuestions[currentQuestionIndex].options.map(
                    (opt, idx) => (
                      <div key={idx} className="option-item">
                        <span className="option-letter">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        <span>{opt}</span>
                      </div>
                    ),
                  )}
                </div>
              )}

              <div className="answer-section">
                <strong>✓ Correct Answer:</strong>{" "}
                {generatedQuestions[currentQuestionIndex].correctAnswer}
              </div>

              {generatedQuestions[currentQuestionIndex].explanation && (
                <div className="explanation-section">
                  <strong>💡 Explanation:</strong>{" "}
                  {generatedQuestions[currentQuestionIndex].explanation}
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
                    : "✓ Accept & Next"}
                </button>
              </div>

              {loading && (
                <div className="loading-overlay">
                  <div className="spinner"></div>
                  <p>AI is generating a replacement question...</p>
                </div>
              )}
            </div>

            <div className="rejected-info">
              <details>
                <summary>
                  📋 View Rejected Questions Bank ({rejectedQuestions.length})
                </summary>
                <div className="rejected-list">
                  {rejectedQuestions.length === 0 ? (
                    <p>No rejected questions yet</p>
                  ) : (
                    rejectedQuestions.map((q, idx) => (
                      <div key={idx} className="rejected-item">
                        <p>
                          <strong>Q{idx + 1}:</strong>{" "}
                          {q.question?.substring(0, 100)}...
                        </p>
                        <small>
                          Rejected: {new Date(q.rejectedAt).toLocaleString()}
                        </small>
                      </div>
                    ))
                  )}
                </div>
              </details>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
