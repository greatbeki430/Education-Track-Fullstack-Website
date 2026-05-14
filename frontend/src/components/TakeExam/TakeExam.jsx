import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import api from "../../api";
import ExamHeader from "./ExamHeader";
import QuestionCard from "./QuestionCard";
import QuestionNavigation from "./QuestionNavigation";
import ConfirmationModal from "../common/ConfirmationModal";
import LoadingSpinner from "../common/LoadingSpinner";
import { calculateProgress } from "../../utils/examUtils";
import SuccessModal from "../common/SuccessModal";
import InfoModal from "../common/InfoModal";
import "./TakeExam.css";

export default function TakeExam({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [markedQuestions, setMarkedQuestions] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalConfig, setInfoModalConfig] = useState({});

  useEffect(() => {
    fetchExam();
  }, [id]);

  // Handle responsive sidebar on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Show floating button when scrolling and sidebar is closed
  useEffect(() => {
    const handleScroll = () => {
      if (!sidebarOpen && window.scrollY > 300) {
        setShowFloatingButton(true);
      } else {
        setShowFloatingButton(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sidebarOpen]);

  const fetchExam = async () => {
    try {
      const res = await api.get(`/api/exams/${id}`);
      setExam(res.data);
      setTimeLeft(res.data.duration * 60);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching exam:", err);
      setInfoModalConfig({
        type: "error",
        title: "Failed to Load Exam",
        message: "Unable to load the exam. Please try again.",
      });
      setShowInfoModal(true);
      setLoading(false);
    }
  };

  // Auto-submit when timer reaches zero
  useEffect(() => {
    if (timeLeft === null || timeLeft > 0 || submitted) return;
    handleSubmit();
  }, [timeLeft]);

  const handleAnswerChange = (questionIndex, answer) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: answer }));
  };

  const toggleMarkQuestion = (questionIndex) => {
    setMarkedQuestions((prev) => ({
      ...prev,
      [questionIndex]: !prev[questionIndex],
    }));
  };

  const handleSubmit = async () => {
    if (submitted) return;
    setSubmitted(true);
    setShowSubmitModal(false);

    try {
      const result = await api.post(`/api/exams/${id}/submit`, {
        studentId: user?.studentId || user?.id,
        studentName: user?.fullName || user?.username || "Student",
        answers,
      });

      const percentage = parseFloat(result.data.percentage);

      // Success modal instead of alert
      setInfoModalConfig({
        type: "success",
        title: "Exam Submitted! 🎉",
        message: `Your score: ${result.data.score}/${result.data.total}\nPercentage: ${percentage}%`,
        autoClose: 4000,
      });
      setShowInfoModal(true);

      setTimeout(() => {
        navigate("/exams");
      }, 2000);
    } catch (err) {
      console.error("Error submitting exam:", err);
      setInfoModalConfig({
        type: "error",
        title: "Submission Failed",
        message:
          err.response?.data?.error ||
          "Failed to submit exam. Please try again.",
      });
      setShowInfoModal(true);
      setSubmitted(false);
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccessModal(false);
    navigate("/exams");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const openSubmitModal = () => {
    setShowSubmitModal(true);
  };

  if (loading) return <LoadingSpinner text="Loading exam..." />;
  if (!exam) return <div className="error-container">Exam not found</div>;

  const progress = calculateProgress(answers, exam.questions);
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = exam.questions?.length || 0;

  return (
    <div className="take-exam-container">
      {/* Toggle Sidebar Button - Always visible */}
      <button
        className={`sidebar-toggle ${!sidebarOpen ? "open" : ""}`}
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? "◀" : "▶"}
      </button>

      {/* Floating Submit Button (visible when sidebar is closed) */}
      {!sidebarOpen && !submitted && (
        <button
          className={`floating-submit-btn ${showFloatingButton ? "visible" : ""}`}
          onClick={openSubmitModal}
        >
          📤 Submit
        </button>
      )}

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`exam-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <h3>📋 Exam Navigation</h3>
          <button
            className="close-sidebar"
            onClick={() => setSidebarOpen(false)}
          >
            ✖
          </button>
        </div>

        <QuestionNavigation
          totalQuestions={totalQuestions}
          currentIndex={currentIndex}
          answers={answers}
          markedQuestions={markedQuestions}
          onNavigate={setCurrentIndex}
        />

        {/* Submit Button Section in Sidebar */}
        <div className="sidebar-footer">
          <div className="progress-stats">
            <div className="stat-item">
              <span className="stat-label">Answered</span>
              <span className="stat-value">
                {answeredCount}/{totalQuestions}
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <button
            className={`submit-exam-btn ${submitted ? "submitted" : ""}`}
            onClick={openSubmitModal}
            disabled={submitted}
          >
            {submitted ? "✓ Exam Submitted" : "📤 Submit Exam"}
          </button>

          {!submitted && answeredCount < totalQuestions && (
            <p className="warning-text">
              ⚠️ {totalQuestions - answeredCount} question(s) unanswered
            </p>
          )}

          {!submitted && answeredCount === totalQuestions && (
            <p className="success-text">
              ✓ All questions answered! Ready to submit.
            </p>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={`exam-main ${!sidebarOpen ? "expanded" : ""}`}>
        <ExamHeader
          title={exam.title}
          description={exam.description}
          timeLeft={timeLeft}
        />

        <div className="questions-area">
          {exam.questions && exam.questions.length > 0 && (
            <QuestionCard
              question={exam.questions[currentIndex]}
              index={currentIndex}
              answer={answers[currentIndex]}
              isMarked={markedQuestions[currentIndex]}
              onAnswerChange={handleAnswerChange}
              onToggleMark={toggleMarkQuestion}
              onNavigate={setCurrentIndex}
              currentIndex={currentIndex}
              totalQuestions={totalQuestions}
              onOpenSubmitModal={openSubmitModal}
            />
          )}
        </div>
      </main>

      {/* Submit Confirmation Modal */}
      <ConfirmationModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={handleSubmit}
        title="Submit Exam"
        message={`Are you sure you want to submit your exam?\n\nYou have answered ${answeredCount} out of ${totalQuestions} questions.\n${totalQuestions - answeredCount} questions remaining.\n\nOnce submitted, you cannot change your answers.`}
      />

      {/* Success Modal for Submission */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Exam Submitted! 🎉"
        message={`You have successfully completed "${submissionResult?.examTitle}".`}
        details={[
          {
            label: "Your Score",
            value: `${submissionResult?.score}/${submissionResult?.total}`,
          },
          { label: "Percentage", value: `${submissionResult?.percentage}%` },
        ]}
        onConfirm={handleSuccessConfirm}
        confirmText="Back to Exams"
        autoClose={5000}
      />
      <InfoModal
        isOpen={showInfoModal}
        onClose={() => {
          setShowInfoModal(false);
          if (
            infoModalConfig.type === "error" &&
            infoModalConfig.title === "Failed to Load Exam"
          ) {
            navigate("/exams");
          }
        }}
        {...infoModalConfig}
      />
    </div>
  );
}
