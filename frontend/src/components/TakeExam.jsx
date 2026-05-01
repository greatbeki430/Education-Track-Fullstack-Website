import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";

export default function TakeExam({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchExam();
  }, [id]);

  const fetchExam = async () => {
    const res = await api.get(`/exams/${id}`);
    setExam(res.data);
    setTimeLeft(res.data.duration * 60);
  };

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerChange = (questionIndex, answer) => {
    setAnswers({ ...answers, [questionIndex]: answer });
  };

  const handleSubmit = async () => {
    if (submitted) return;
    setSubmitted(true);
    try {
      const result = await api.post(`/exams/${id}/submit`, {
        studentId: user?.studentId || "STU001",
        studentName: user?.fullName || user?.username || "Student",
        answers,
      });
      alert(
        `Exam submitted! Your score: ${result.data.score}/${result.data.total}`,
      );
      navigate("/exams");
    } catch (err) {
      alert("Error submitting exam");
    }
  };

  if (!exam) return <div>Loading exam...</div>;

  return (
    <div className="container">
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2>{exam.title}</h2>
          <div
            className="timer"
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              color: timeLeft < 60 ? "red" : "green",
            }}
          >
            ⏰ {formatTime(timeLeft)}
          </div>
        </div>
        <p>{exam.description}</p>
      </div>

      <div className="card">
        {exam.questions.map((q, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: "2rem",
              padding: "1rem",
              background: "#f9f9f9",
              borderRadius: "8px",
            }}
          >
            <h3>
              Question {idx + 1}: {q.text} ({q.points} points)
            </h3>
            {q.type === "multiple-choice" && (
              <div>
                {q.options.map((opt, optIdx) => (
                  <label
                    key={optIdx}
                    style={{ display: "block", margin: "0.5rem 0" }}
                  >
                    <input
                      type="radio"
                      name={`q${idx}`}
                      value={opt}
                      checked={answers[idx] === opt}
                      onChange={(e) => handleAnswerChange(idx, e.target.value)}
                    />{" "}
                    {opt}
                  </label>
                ))}
              </div>
            )}
            {q.type === "true-false" && (
              <div>
                <label>
                  <input
                    type="radio"
                    name={`q${idx}`}
                    value="True"
                    onChange={(e) => handleAnswerChange(idx, e.target.value)}
                  />{" "}
                  True
                </label>
                <label>
                  <input
                    type="radio"
                    name={`q${idx}`}
                    value="False"
                    onChange={(e) => handleAnswerChange(idx, e.target.value)}
                  />{" "}
                  False
                </label>
              </div>
            )}
          </div>
        ))}
        <button onClick={handleSubmit} className="btn" disabled={submitted}>
          {submitted ? "Submitting..." : "📤 Submit Exam"}
        </button>
      </div>
    </div>
  );
}
