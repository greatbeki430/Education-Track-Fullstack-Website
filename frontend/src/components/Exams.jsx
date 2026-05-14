import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import confetti from "canvas-confetti";
import api from "../api";
import SuccessModal from "./common/SuccessModal";
import InfoModal from "./common/InfoModal";
import "../styles/exams.css";

export default function Exams({ user }) {
  const [exams, setExams] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState("");

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [customNumQuestions, setCustomNumQuestions] = useState("");
  const [customGradeLevel, setCustomGradeLevel] = useState("");
  const [showCustomNum, setShowCustomNum] = useState(false);
  const [showCustomGrade, setShowCustomGrade] = useState(false);

  // AI config state
  const [aiConfig, setAiConfig] = useState({
    topic: "",
    difficulty: "medium",
    numQuestions: 5,
    gradeLevel: 11,
    questionTypes: ["multiple-choice", "true-false"],
    customInstructions: "",
  });

  const [generatedQuestions, setGeneratedQuestions] = useState([]);

  // Manual exam form state
  const [newExam, setNewExam] = useState({
    title: "",
    description: "",
    duration: 30,
    startTime: "",
    endTime: "",
    questions: [
      {
        text: "",
        type: "multiple-choice",
        options: ["", "", "", ""],
        correctAnswer: "",
        points: 1,
      },
    ],
  });

  // Modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [examSuccessDetails, setExamSuccessDetails] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalConfig, setInfoModalConfig] = useState({});

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/exams");
      setExams(res.data);
    } catch (err) {
      console.error("Failed to fetch exams:", err);
    } finally {
      setLoading(false);
    }
  };

  // ─── AI Generation ────────────────────────────────────────────────────────

  const generateExamWithAI = async () => {
    setAiError("");

    if (!aiConfig.topic.trim() && !selectedFile) {
      setAiError("Please enter a topic OR upload a file.");
      return;
    }
    if (aiConfig.questionTypes.length === 0) {
      setAiError("Please select at least one question type.");
      return;
    }

    const resolvedNum =
      aiConfig.numQuestions === "custom"
        ? parseInt(customNumQuestions)
        : aiConfig.numQuestions;
    const resolvedGrade =
      aiConfig.gradeLevel === "custom"
        ? parseInt(customGradeLevel)
        : aiConfig.gradeLevel;

    if (!resolvedNum || resolvedNum < 1 || resolvedNum > 50) {
      setAiError("Number of questions must be between 1 and 50.");
      return;
    }

    setGeneratingAI(true);
    setGeneratedQuestions([]);

    try {
      let response;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("numQuestions", resolvedNum);
        formData.append("gradeLevel", resolvedGrade);
        formData.append("difficulty", aiConfig.difficulty);
        formData.append(
          "questionTypes",
          JSON.stringify(aiConfig.questionTypes),
        );
        formData.append("customInstructions", aiConfig.customInstructions);

        response = await api.post("/api/ai/generate-from-file", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 120000,
        });
      } else {
        response = await api.post("/api/ai/generate-exam", {
          topic: aiConfig.topic.trim(),
          numQuestions: resolvedNum,
          gradeLevel: resolvedGrade,
          difficulty: aiConfig.difficulty,
          questionTypes: aiConfig.questionTypes,
          customInstructions: aiConfig.customInstructions,
        });
      }

      if (!response.data?.questions?.length) {
        throw new Error("No questions were returned. Please try again.");
      }

      setGeneratedQuestions(response.data.questions);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        "Failed to generate questions. Check your API key and try again.";
      setAiError(msg);
      console.error("AI generation error:", err);
    } finally {
      setGeneratingAI(false);
    }
  };

  // Replace a single question at index
  const replaceQuestion = async (idx) => {
    const q = generatedQuestions[idx];
    try {
      const response = await api.post("/api/ai/generate-replacement", {
        originalQuestion: q,
        sourceContent: "",
        gradeLevel:
          aiConfig.gradeLevel === "custom"
            ? parseInt(customGradeLevel)
            : aiConfig.gradeLevel,
        difficulty: aiConfig.difficulty,
        customInstructions: aiConfig.customInstructions,
      });

      if (response.data?.question) {
        const updated = [...generatedQuestions];
        updated[idx] = response.data.question;
        setGeneratedQuestions(updated);
      }
    } catch (err) {
      alert(
        "Could not replace question: " +
          (err.response?.data?.error || err.message),
      );
    }
  };

  // Save a rejected question to the bank before replacing
  const rejectAndReplace = async (idx) => {
    const q = generatedQuestions[idx];
    try {
      await api.post("/api/ai/save-rejected", {
        question: q,
        reason: "Teacher rejected during review",
        topic: aiConfig.topic || selectedFile?.name || "Document",
        gradeLevel:
          aiConfig.gradeLevel === "custom"
            ? parseInt(customGradeLevel)
            : aiConfig.gradeLevel,
      });
    } catch {
      /* saving to rejected bank is non-critical */
    }
    await replaceQuestion(idx);
  };

  const useAIGeneratedQuestions = () => {
    if (generatedQuestions.length === 0) return;

    setNewExam((prev) => ({
      ...prev,
      title:
        prev.title || `AI Generated Exam – ${new Date().toLocaleDateString()}`,
      questions: generatedQuestions.map((q) => ({
        text: q.text,
        type: q.type,
        options: q.options || ["", "", "", ""],
        correctAnswer: q.correctAnswer,
        points: q.points || 1,
      })),
    }));

    setGeneratedQuestions([]);
    setSelectedFile(null);
    setShowAIGenerator(false);
    setShowCreateForm(true);
  };

  const cancelAIGeneration = () => {
    setShowAIGenerator(false);
    setGeneratedQuestions([]);
    setSelectedFile(null);
    setAiError("");
    setAiConfig({
      topic: "",
      difficulty: "medium",
      numQuestions: 5,
      gradeLevel: 11,
      questionTypes: ["multiple-choice", "true-false"],
      customInstructions: "",
    });
    setCustomNumQuestions("");
    setCustomGradeLevel("");
    setShowCustomNum(false);
    setShowCustomGrade(false);
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
      setAiError("Please upload a PDF, DOCX, or TXT file.");
      return;
    }
    setAiError("");
    setSelectedFile(file);
    setAiConfig((prev) => ({ ...prev, topic: "" }));
  };

  const handleNumQuestionsChange = (value) => {
    if (value === "custom") {
      setShowCustomNum(true);
      setAiConfig((prev) => ({ ...prev, numQuestions: "custom" }));
    } else {
      setShowCustomNum(false);
      setAiConfig((prev) => ({ ...prev, numQuestions: parseInt(value) }));
    }
  };

  const handleGradeLevelChange = (value) => {
    if (value === "custom") {
      setShowCustomGrade(true);
      setAiConfig((prev) => ({ ...prev, gradeLevel: "custom" }));
    } else {
      setShowCustomGrade(false);
      setAiConfig((prev) => ({ ...prev, gradeLevel: parseInt(value) }));
    }
  };

  const toggleQuestionType = (type, checked) => {
    setAiConfig((prev) => ({
      ...prev,
      questionTypes: checked
        ? [...prev.questionTypes, type]
        : prev.questionTypes.filter((t) => t !== type),
    }));
  };

  // ─── Manual Exam Form ─────────────────────────────────────────────────────

  const addQuestion = () => {
    setNewExam((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          text: "",
          type: "multiple-choice",
          options: ["", "", "", ""],
          correctAnswer: "",
          points: 1,
        },
      ],
    }));
  };

  const removeQuestion = (idx) => {
    setNewExam((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx),
    }));
  };

  const updateQuestion = (idx, field, value) => {
    setNewExam((prev) => {
      const updated = [...prev.questions];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, questions: updated };
    });
  };

  const createExam = async () => {
    if (!newExam.title.trim()) {
      setInfoModalConfig({
        type: "warning",
        title: "Missing Information",
        message: "Please enter an exam title.",
      });
      setShowInfoModal(true);
      return;
    }
    if (newExam.questions.some((q) => !q.text.trim())) {
      setInfoModalConfig({
        type: "warning",
        title: "Incomplete Questions",
        message: "All questions must have text.",
      });
      setShowInfoModal(true);
      return;
    }
    try {
      const response = await api.post("/api/exams", {
        ...newExam,
        createdBy: user?.fullName || user?.username,
      });

      // Success modal
      setInfoModalConfig({
        type: "success",
        title: "Success!",
        message: `Exam "${newExam.title}" created successfully!`,
        autoClose: 2000,
      });
      setShowInfoModal(true);

      setShowCreateForm(false);
      setNewExam({
        title: "",
        description: "",
        duration: 30,
        questions: [
          {
            text: "",
            type: "multiple-choice",
            options: ["", "", "", ""],
            correctAnswer: "",
            points: 1,
          },
        ],
      });
      fetchExams();
    } catch (err) {
      setInfoModalConfig({
        type: "error",
        title: "Error Creating Exam",
        message: err.response?.data?.error || err.message,
      });
      setShowInfoModal(true);
    }
  };
  const handleSuccessConfirm = () => {
    setShowSuccessModal(false);
  };

  // ─── SINGLE RETURN STATEMENT ───────────────────────────────────────────────
  return (
    <>
      <div className="exams-container">
        {/* Header */}
        <div className="exams-header">
          <div className="exams-title-section">
            <div className="exams-icon">📖</div>
            <div>
              <h1>Online Examinations</h1>
              <p>Create, manage, and take online exams with automatic timers</p>
            </div>
          </div>
          {(user?.role === "admin" || user?.role === "teacher") && (
            <div className="header-buttons">
              <button
                onClick={() => {
                  setShowCreateForm(!showCreateForm);
                  setShowAIGenerator(false);
                }}
                className="btn-create-exam"
              >
                {showCreateForm ? "✖ Cancel" : "+ Create New Exam"}
              </button>
              <button
                onClick={() => {
                  setShowAIGenerator(!showAIGenerator);
                  setShowCreateForm(false);
                }}
                className="btn-ai-generate"
              >
                🤖 Generate with AI
              </button>
            </div>
          )}
        </div>

        {/* AI Generator Panel */}
        {showAIGenerator && (
          <div className="ai-generator-card">
            <div className="ai-header">
              <span className="ai-icon">🤖</span>
              <h3>AI Exam Generator</h3>
              <p>
                Upload a file OR enter a topic — questions are generated by
                GPT-4o Mini
              </p>
            </div>

            <div className="ai-form">
              {/* File Upload */}
              <div className="form-group">
                <label className="form-label">
                  📄 Upload File (PDF, DOCX, TXT)
                </label>
                <div className="file-upload-area">
                  <input
                    type="file"
                    id="fileUpload"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />
                  <button
                    className="file-upload-btn"
                    onClick={() =>
                      document.getElementById("fileUpload").click()
                    }
                  >
                    📁 Choose File
                  </button>
                  {selectedFile && (
                    <span className="file-name">
                      ✅ {selectedFile.name}{" "}
                      <button
                        className="clear-file-btn"
                        onClick={() => {
                          setSelectedFile(null);
                          document.getElementById("fileUpload").value = "";
                        }}
                      >
                        ✖
                      </button>
                    </span>
                  )}
                </div>
                <small>OR enter a topic below</small>
              </div>

              {/* Topic */}
              <div className="form-group">
                <label className="form-label">📚 Topic / Subject</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., JavaScript Arrays, World War II, Photosynthesis"
                  value={aiConfig.topic}
                  disabled={!!selectedFile}
                  onChange={(e) =>
                    setAiConfig((prev) => ({ ...prev, topic: e.target.value }))
                  }
                />
                {selectedFile && (
                  <small className="info-text">
                    ✓ Using uploaded file (topic disabled)
                  </small>
                )}
              </div>

              {/* Difficulty / Questions / Grade */}
              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">🎯 Difficulty</label>
                  <select
                    className="form-select"
                    value={aiConfig.difficulty}
                    onChange={(e) =>
                      setAiConfig((prev) => ({
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

                <div className="form-group">
                  <label className="form-label">🔢 Number of Questions</label>
                  <select
                    className="form-select"
                    value={aiConfig.numQuestions}
                    onChange={(e) => handleNumQuestionsChange(e.target.value)}
                  >
                    <option value={3}>3 questions</option>
                    <option value={5}>5 questions</option>
                    <option value={10}>10 questions</option>
                    <option value={15}>15 questions</option>
                    <option value={20}>20 questions</option>
                    <option value="custom">Custom…</option>
                  </select>
                  {showCustomNum && (
                    <input
                      type="number"
                      className="custom-input"
                      placeholder="Enter number (1–50)"
                      value={customNumQuestions}
                      onChange={(e) => setCustomNumQuestions(e.target.value)}
                      min="1"
                      max="50"
                    />
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">📖 Grade Level</label>
                  <select
                    className="form-select"
                    value={aiConfig.gradeLevel}
                    onChange={(e) => handleGradeLevelChange(e.target.value)}
                  >
                    <option value={9}>Grade 9</option>
                    <option value={10}>Grade 10</option>
                    <option value={11}>Grade 11</option>
                    <option value={12}>Grade 12</option>
                    <option value="custom">Custom…</option>
                  </select>
                  {showCustomGrade && (
                    <input
                      type="number"
                      className="custom-input"
                      placeholder="Enter grade (1–12)"
                      value={customGradeLevel}
                      onChange={(e) => setCustomGradeLevel(e.target.value)}
                      min="1"
                      max="12"
                    />
                  )}
                </div>
              </div>

              {/* Question Types */}
              <div className="form-group">
                <label className="form-label">📝 Question Types</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={aiConfig.questionTypes.includes(
                        "multiple-choice",
                      )}
                      onChange={(e) =>
                        toggleQuestionType("multiple-choice", e.target.checked)
                      }
                    />
                    Multiple Choice
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={aiConfig.questionTypes.includes("true-false")}
                      onChange={(e) =>
                        toggleQuestionType("true-false", e.target.checked)
                      }
                    />
                    True / False
                  </label>
                </div>
              </div>

              {/* Custom Instructions */}
              <div className="form-group">
                <label className="form-label">
                  📋 Custom Instructions (Optional)
                </label>
                <textarea
                  className="form-textarea"
                  placeholder="e.g., Focus on vocabulary, include questions about dates, emphasize critical thinking…"
                  value={aiConfig.customInstructions}
                  onChange={(e) =>
                    setAiConfig((prev) => ({
                      ...prev,
                      customInstructions: e.target.value,
                    }))
                  }
                  rows="2"
                />
              </div>

              {/* Error Message */}
              {aiError && <div className="ai-error">❌ {aiError}</div>}

              <div className="ai-actions">
                <button
                  onClick={generateExamWithAI}
                  className="btn-generate"
                  disabled={generatingAI}
                >
                  {generatingAI
                    ? "✨ Generating…"
                    : "✨ Generate Exam Questions"}
                </button>
                <button onClick={cancelAIGeneration} className="btn-cancel">
                  Cancel
                </button>
              </div>
            </div>

            {/* Generated Questions Preview */}
            {generatedQuestions.length > 0 && (
              <div className="generated-questions-preview">
                <h4>✅ Generated Questions — Review & Edit</h4>
                <p className="preview-hint">
                  Use the ↺ button to replace any question you don't like.
                  OpenAI will generate a fresh replacement.
                </p>
                <div className="preview-list">
                  {generatedQuestions.map((q, idx) => (
                    <div key={q.id || idx} className="preview-item">
                      <div className="preview-item-header">
                        <strong>Q{idx + 1}</strong>
                        <span className="preview-type-badge">{q.type}</span>
                        <button
                          className="btn-replace-question"
                          title="Replace with a new AI-generated question"
                          onClick={() => rejectAndReplace(idx)}
                        >
                          ↺ Replace
                        </button>
                      </div>
                      <p className="preview-question-text">{q.text}</p>
                      <div className="preview-options">
                        {q.options.map((opt, oi) => (
                          <span
                            key={oi}
                            className={`preview-option ${
                              opt === q.correctAnswer ? "correct-option" : ""
                            }`}
                          >
                            {opt === q.correctAnswer && "✓ "}
                            {opt}
                          </span>
                        ))}
                      </div>
                      {q.explanation && (
                        <p className="preview-explanation">
                          💡 {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="preview-actions">
                  <button
                    onClick={useAIGeneratedQuestions}
                    className="btn-use-questions"
                  >
                    📋 Use These Questions in My Exam
                  </button>
                  <button
                    onClick={() => {
                      setGeneratedQuestions([]);
                      setAiError("");
                    }}
                    className="btn-cancel"
                  >
                    Discard & Regenerate
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual Create Exam Form */}
        {showCreateForm && (
          <div className="exam-form-card">
            <h3>✏️ Create New Exam</h3>

            <div className="form-group">
              <label className="form-label">Exam Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., JavaScript Final Exam"
                value={newExam.title}
                onChange={(e) =>
                  setNewExam((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description / Instructions</label>
              <textarea
                className="form-textarea"
                placeholder="Enter exam instructions here…"
                rows="3"
                value={newExam.description}
                onChange={(e) =>
                  setNewExam((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Duration (minutes)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="30"
                  value={newExam.duration}
                  onChange={(e) =>
                    setNewExam((prev) => ({
                      ...prev,
                      duration: parseInt(e.target.value) || 30,
                    }))
                  }
                />
              </div>
            </div>

            <h4 className="questions-title">
              📝 Questions ({newExam.questions.length})
            </h4>

            {newExam.questions.map((q, idx) => (
              <div key={idx} className="question-card">
                <div className="question-number">Question {idx + 1}</div>

                <div className="form-group">
                  <label className="form-label">Question Text</label>
                  <input
                    type="text"
                    className="question-input"
                    placeholder="Enter your question here…"
                    value={q.text}
                    onChange={(e) =>
                      updateQuestion(idx, "text", e.target.value)
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Question Type</label>
                  <select
                    className="question-type-select"
                    value={q.type}
                    onChange={(e) =>
                      updateQuestion(idx, "type", e.target.value)
                    }
                  >
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="true-false">True / False</option>
                  </select>
                </div>

                {q.type === "multiple-choice" && (
                  <div className="options-container">
                    <label className="form-label">Answer Options</label>
                    {q.options.map((opt, optIdx) => (
                      <input
                        key={optIdx}
                        type="text"
                        className="option-input"
                        placeholder={`Option ${optIdx + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const newOptions = [...q.options];
                          newOptions[optIdx] = e.target.value;
                          updateQuestion(idx, "options", newOptions);
                        }}
                      />
                    ))}
                  </div>
                )}

                <div className="question-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label">Correct Answer</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Must match one of the options exactly"
                      value={q.correctAnswer}
                      onChange={(e) =>
                        updateQuestion(idx, "correctAnswer", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Points</label>
                    <input
                      type="number"
                      className="points-input"
                      placeholder="1"
                      value={q.points}
                      onChange={(e) =>
                        updateQuestion(
                          idx,
                          "points",
                          parseInt(e.target.value) || 1,
                        )
                      }
                    />
                  </div>
                </div>

                {newExam.questions.length > 1 && (
                  <button
                    onClick={() => removeQuestion(idx)}
                    className="btn-remove-question"
                  >
                    🗑️ Remove Question
                  </button>
                )}
              </div>
            ))}

            <button onClick={addQuestion} className="btn-add-question">
              + Add Another Question
            </button>

            <button onClick={createExam} className="btn-submit-exam">
              📢 Create Exam
            </button>
          </div>
        )}

        {/* Exams List */}
        <div className="exams-list">
          {loading ? (
            <div className="exams-loading">
              <div className="exams-spinner"></div>
              <p>Loading exams…</p>
            </div>
          ) : exams.length === 0 ? (
            <div className="exams-empty-state">
              <div className="exams-empty-icon">📭</div>
              <h4>No Exams Available</h4>
              <p>No exams have been created yet.</p>
              {(user?.role === "admin" || user?.role === "teacher") && (
                <div className="empty-actions">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="btn-primary"
                  >
                    + Create First Exam
                  </button>
                  <button
                    onClick={() => setShowAIGenerator(true)}
                    className="btn-ai"
                  >
                    🤖 Generate with AI
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="exams-grid">
              {exams.map((exam) => (
                <div key={exam.id} className="exam-card">
                  <div className="exam-badge">📋</div>
                  <h3 className="exam-title">{exam.title}</h3>
                  <p className="exam-description">{exam.description}</p>
                  <div className="exam-meta">
                    <span className="exam-duration">
                      ⏰ {exam.duration} minutes
                    </span>
                    <span className="exam-questions-count">
                      ❓ {JSON.parse(exam.questions).length} questions
                    </span>
                  </div>
                  <Link to={`/take-exam/${exam.id}`}>
                    <button className="btn-start-exam">▶ Start Exam</button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Success Modal - placed outside main container but inside fragment */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Exam Created Successfully! 🎉"
        message={`"${examSuccessDetails?.title}" has been created and is ready for students.`}
        details={[
          { label: "Questions", value: examSuccessDetails?.questionsCount },
          {
            label: "Duration",
            value: `${examSuccessDetails?.duration} minutes`,
          },
        ]}
        onConfirm={handleSuccessConfirm}
        confirmText="View Exams"
        autoClose={4000}
      />
      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        {...infoModalConfig}
      />
    </>
  );
}
