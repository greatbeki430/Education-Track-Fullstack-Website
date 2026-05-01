import React, { useState, useEffect } from "react";
import api from "../api";
import ScoreForm from "./ScoreForm";
import ScoreTable from "./ScoreTable";
import StatsCard from "./StatsCard";
import ExportButtons from "./ExportButtons";

export default function Gradebook() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAssessment, setFilterAssessment] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchScores = async () => {
    try {
      const res = await api.get("/scores");
      setScores(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, []);

  const addScore = async (newScore) => {
    const res = await api.post("/scores", newScore);
    setScores((prev) => [res.data, ...prev]);
  };

  const updateScore = async (id, updated) => {
    const res = await api.put(`/scores/${id}`, updated);
    setScores((prev) => prev.map((s) => (s.id === id ? res.data : s)));
  };

  const deleteScore = async (id) => {
    await api.delete(`/scores/${id}`);
    setScores((prev) => prev.filter((s) => s.id !== id));
  };

  const filteredScores = scores.filter((score) => {
    if (filterAssessment !== "ALL" && score.assessment !== filterAssessment)
      return false;
    if (
      searchTerm &&
      !score.studentName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !score.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    return true;
  });

  const assessments = ["ALL", ...new Set(scores.map((s) => s.assessment))];

  return (
    <div className="container">
      <div className="card">
        <h1>📊 Gradebook - Assessment Management</h1>
        <p>Manage student scores, calculate averages, and generate reports</p>
      </div>

      <ScoreForm onSubmit={addScore} />

      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          <div>
            <label>Filter by Assessment: </label>
            <select
              value={filterAssessment}
              onChange={(e) => setFilterAssessment(e.target.value)}
            >
              {assessments.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Search: </label>
            <input
              type="text"
              placeholder="Name or ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ExportButtons scores={filteredScores} />
        </div>

        <StatsCard scores={filteredScores} />
        {loading ? (
          <p>Loading...</p>
        ) : (
          <ScoreTable
            scores={filteredScores}
            onEdit={updateScore}
            onDelete={deleteScore}
          />
        )}
      </div>
    </div>
  );
}
