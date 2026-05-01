import React, { useState } from "react";

export default function ScoreForm({ onSubmit, initialData = null }) {
  const [form, setForm] = useState({
    studentId: initialData?.studentId || "",
    studentName: initialData?.studentName || "",
    assessment: initialData?.assessment || "Quiz 1",
    score: initialData?.score || 75,
    customAssessment: "",
  });
  const [editingId, setEditingId] = useState(initialData?.id || null);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalAssessment = form.customAssessment.trim() || form.assessment;
    const payload = {
      studentId: form.studentId,
      studentName: form.studentName,
      assessment: finalAssessment,
      score: Number(form.score),
    };
    onSubmit(payload);
    setForm({
      studentId: "",
      studentName: "",
      assessment: "Quiz 1",
      score: 75,
      customAssessment: "",
    });
  };

  return (
    <div className="card">
      <h2>✏️ Add / Edit Assessment Score</h2>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "flex-end",
        }}
      >
        <input
          name="studentId"
          placeholder="Student ID (e.g., G11-001)"
          value={form.studentId}
          onChange={handleChange}
          required
        />
        <input
          name="studentName"
          placeholder="Full Name"
          value={form.studentName}
          onChange={handleChange}
          required
        />
        <select
          name="assessment"
          value={form.assessment}
          onChange={handleChange}
        >
          <option>Quiz 1</option>
          <option>Quiz 2</option>
          <option>Mid Exam</option>
          <option>Final Exam</option>
          <option>Project</option>
          <option>Practical</option>
        </select>
        <input
          name="customAssessment"
          placeholder="Or custom (e.g., Assignment)"
          value={form.customAssessment}
          onChange={handleChange}
        />
        <input
          name="score"
          type="number"
          min="0"
          max="100"
          value={form.score}
          onChange={handleChange}
          required
        />
        <button type="submit" className="btn">
          {editingId ? "Update" : "Save Score"}
        </button>
      </form>
    </div>
  );
}
