import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import "../styles/exams.css";

export default function Exams({ user }) {
  const [exams, setExams] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generatingAI, setGeneratingAI] = useState(false);

  // FILE UPLOAD STATE (NEW)
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [customNumQuestions, setCustomNumQuestions] = useState("");
  const [customGradeLevel, setCustomGradeLevel] = useState("");
  const [showCustomNum, setShowCustomNum] = useState(false);
  const [showCustomGrade, setShowCustomGrade] = useState(false);

  // AI Generator State
  const [aiConfig, setAiConfig] = useState({
    topic: "",
    difficulty: "medium",
    numQuestions: 5,
    gradeLevel: 11,
    questionTypes: ["multiple-choice", "true-false"],
    customInstructions: "",
  });

  const [generatedQuestions, setGeneratedQuestions] = useState([]);

  // Manual Exam Form State
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

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await api.get("/exams");
      setExams(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ============ AI GENERATION FUNCTIONS WITH FILE UPLOAD ============
  const generateExamWithAI = async () => {
    // Validate: either topic OR file must be provided
    if (!aiConfig.topic && !selectedFile) {
      alert("Please enter a topic OR upload a file");
      return;
    }

    setGeneratingAI(true);
    try {
      let response;

      if (selectedFile) {
        // Use file upload API
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append(
          "numQuestions",
          aiConfig.numQuestions === "custom"
            ? customNumQuestions
            : aiConfig.numQuestions,
        );
        formData.append(
          "gradeLevel",
          aiConfig.gradeLevel === "custom"
            ? customGradeLevel
            : aiConfig.gradeLevel,
        );
        formData.append("difficulty", aiConfig.difficulty);
        formData.append(
          "questionTypes",
          JSON.stringify(aiConfig.questionTypes),
        );
        formData.append("customInstructions", aiConfig.customInstructions);

        try {
          response = await api.post("/ai/generate-from-file", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch (err) {
          console.log("Using mock file AI");
          response = await api.post("/ai/generate-from-file-mock", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      } else {
        // Use topic-based API
        const payload = {
          ...aiConfig,
          numQuestions:
            aiConfig.numQuestions === "custom"
              ? parseInt(customNumQuestions)
              : aiConfig.numQuestions,
          gradeLevel:
            aiConfig.gradeLevel === "custom"
              ? parseInt(customGradeLevel)
              : aiConfig.gradeLevel,
        };

        try {
          response = await api.post("/ai/generate-exam", payload);
        } catch (err) {
          console.log("Using mock AI (no API key)");
          response = await api.post("/ai/generate-exam-mock", payload);
        }
      }

      setGeneratedQuestions(response.data.questions);
      alert(
        `✅ Generated ${response.data.questions.length} questions successfully!\nReview and edit them before saving.`,
      );
    } catch (err) {
      alert("Error generating exam: " + err.message);
    } finally {
      setGeneratingAI(false);
    }
  };

  // Use AI generated questions in the exam form
  const useAIGeneratedQuestions = () => {
    setNewExam({
      ...newExam,
      title:
        newExam.title ||
        `AI Generated Exam - ${new Date().toLocaleDateString()}`,
      questions: generatedQuestions.map((q) => ({
        text: q.text,
        type: q.type,
        options: q.options || ["", "", "", ""],
        correctAnswer: q.correctAnswer,
        points: q.points || 1,
      })),
    });
    setGeneratedQuestions([]);
    setSelectedFile(null);
    setShowAIGenerator(false);
    setShowCreateForm(true);
    alert("AI-generated questions added! You can now edit them before saving.");
  };

  const cancelAIGeneration = () => {
    setShowAIGenerator(false);
    setGeneratedQuestions([]);
    setSelectedFile(null);
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
    if (file) {
      const validTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ];
      if (!validTypes.includes(file.type)) {
        alert("Please upload PDF, DOCX, or TXT file");
        return;
      }
      setSelectedFile(file);
      // Clear topic when file is selected
      setAiConfig({ ...aiConfig, topic: "" });
    }
  };

  const handleNumQuestionsChange = (value) => {
    if (value === "custom") {
      setShowCustomNum(true);
      setAiConfig({ ...aiConfig, numQuestions: "custom" });
    } else {
      setShowCustomNum(false);
      setAiConfig({ ...aiConfig, numQuestions: parseInt(value) });
    }
  };

  const handleGradeLevelChange = (value) => {
    if (value === "custom") {
      setShowCustomGrade(true);
      setAiConfig({ ...aiConfig, gradeLevel: "custom" });
    } else {
      setShowCustomGrade(false);
      setAiConfig({ ...aiConfig, gradeLevel: parseInt(value) });
    }
  };

  // ============ MANUAL QUESTION FUNCTIONS ============
  const addQuestion = () => {
    setNewExam({
      ...newExam,
      questions: [
        ...newExam.questions,
        {
          text: "",
          type: "multiple-choice",
          options: ["", "", "", ""],
          correctAnswer: "",
          points: 1,
        },
      ],
    });
  };

  const removeQuestion = (idx) => {
    const updated = [...newExam.questions];
    updated.splice(idx, 1);
    setNewExam({ ...newExam, questions: updated });
  };

  const updateQuestion = (idx, field, value) => {
    const updated = [...newExam.questions];
    updated[idx][field] = value;
    setNewExam({ ...newExam, questions: updated });
  };

  const createExam = async () => {
    if (!newExam.title) {
      alert("Please enter an exam title");
      return;
    }
    try {
      await api.post("/exams", {
        ...newExam,
        createdBy: user?.fullName || user?.username,
      });
      alert("✅ Exam created successfully!");
      setShowCreateForm(false);
      setNewExam({
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
      fetchExams();
    } catch (err) {
      alert("❌ Error creating exam");
    }
  };

  return (
    <div className="exams-container">
      {/* Header Section */}
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
            <p>Upload a file OR enter a topic to generate questions</p>
          </div>

          <div className="ai-form">
            {/* FILE UPLOAD SECTION - NEW */}
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
                  onClick={() => document.getElementById("fileUpload").click()}
                >
                  📁 Choose File
                </button>
                {selectedFile && (
                  <span className="file-name">
                    Selected: {selectedFile.name}
                  </span>
                )}
              </div>
              <small>OR</small>
            </div>

            <div className="form-group">
              <label className="form-label">
                📚 Topic / Subject (if no file)
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., JavaScript Arrays, World War II, Photosynthesis"
                value={aiConfig.topic}
                disabled={selectedFile !== null}
                onChange={(e) =>
                  setAiConfig({ ...aiConfig, topic: e.target.value })
                }
              />
              {selectedFile && (
                <small className="info-text">
                  ✓ Using uploaded file (topic disabled)
                </small>
              )}
            </div>

            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">🎯 Difficulty</label>
                <select
                  className="form-select"
                  value={aiConfig.difficulty}
                  onChange={(e) =>
                    setAiConfig({ ...aiConfig, difficulty: e.target.value })
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
                  <option value="custom">Custom...</option>
                </select>
                {showCustomNum && (
                  <input
                    type="number"
                    className="custom-input"
                    placeholder="Enter number (1-50)"
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
                  <option value="custom">Custom...</option>
                </select>
                {showCustomGrade && (
                  <input
                    type="number"
                    className="custom-input"
                    placeholder="Enter grade (1-12)"
                    value={customGradeLevel}
                    onChange={(e) => setCustomGradeLevel(e.target.value)}
                    min="1"
                    max="12"
                  />
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">📝 Question Types</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={aiConfig.questionTypes.includes("multiple-choice")}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAiConfig({
                          ...aiConfig,
                          questionTypes: [
                            ...aiConfig.questionTypes,
                            "multiple-choice",
                          ],
                        });
                      } else {
                        setAiConfig({
                          ...aiConfig,
                          questionTypes: aiConfig.questionTypes.filter(
                            (t) => t !== "multiple-choice",
                          ),
                        });
                      }
                    }}
                  />
                  Multiple Choice
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={aiConfig.questionTypes.includes("true-false")}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAiConfig({
                          ...aiConfig,
                          questionTypes: [
                            ...aiConfig.questionTypes,
                            "true-false",
                          ],
                        });
                      } else {
                        setAiConfig({
                          ...aiConfig,
                          questionTypes: aiConfig.questionTypes.filter(
                            (t) => t !== "true-false",
                          ),
                        });
                      }
                    }}
                  />
                  True / False
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                📋 Custom Instructions (Optional)
              </label>
              <textarea
                className="form-textarea"
                placeholder="e.g., Focus on vocabulary, Include questions about dates, Emphasize critical thinking..."
                value={aiConfig.customInstructions}
                onChange={(e) =>
                  setAiConfig({
                    ...aiConfig,
                    customInstructions: e.target.value,
                  })
                }
                rows="2"
              />
            </div>

            <div className="ai-actions">
              <button
                onClick={generateExamWithAI}
                className="btn-generate"
                disabled={generatingAI}
              >
                {generatingAI
                  ? "✨ Generating..."
                  : "✨ Generate Exam Questions"}
              </button>
              <button onClick={cancelAIGeneration} className="btn-cancel">
                Cancel
              </button>
            </div>
          </div>

          {generatedQuestions.length > 0 && (
            <div className="generated-questions-preview">
              <h4>✅ Generated Questions Preview</h4>
              <div className="preview-list">
                {generatedQuestions.map((q, idx) => (
                  <div key={idx} className="preview-item">
                    <strong>Q{idx + 1}:</strong> {q.text}
                    <br />
                    <small>
                      Type: {q.type} | Points: {q.points}
                    </small>
                  </div>
                ))}
              </div>
              <button
                onClick={useAIGeneratedQuestions}
                className="btn-use-questions"
              >
                📋 Use These Questions in My Exam
              </button>
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
                setNewExam({ ...newExam, title: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description / Instructions</label>
            <textarea
              className="form-textarea"
              placeholder="Enter exam instructions here..."
              rows="3"
              value={newExam.description}
              onChange={(e) =>
                setNewExam({ ...newExam, description: e.target.value })
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
                  setNewExam({ ...newExam, duration: parseInt(e.target.value) })
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
                  placeholder="Enter your question here..."
                  value={q.text}
                  onChange={(e) => updateQuestion(idx, "text", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Question Type</label>
                <select
                  className="question-type-select"
                  value={q.type}
                  onChange={(e) => updateQuestion(idx, "type", e.target.value)}
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
                    placeholder="Correct answer"
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
                    placeholder="Points"
                    value={q.points}
                    onChange={(e) =>
                      updateQuestion(idx, "points", parseInt(e.target.value))
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

      {/* Available Exams List */}
      <div className="exams-list">
        {loading ? (
          <div className="exams-loading">
            <div className="exams-spinner"></div>
            <p>Loading exams...</p>
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
  );
}
