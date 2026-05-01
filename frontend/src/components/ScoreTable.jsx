import React, { useState } from "react";
import api from "../api";

function getGrade(score) {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

export default function ScoreTable({ scores, onEdit, onDelete }) {
  const [editingRow, setEditingRow] = useState(null);
  const [editData, setEditData] = useState({});

  const startEdit = (score) => {
    setEditingRow(score.id);
    setEditData({ ...score });
  };

  const saveEdit = async () => {
    await onEdit(editingRow, editData);
    setEditingRow(null);
  };

  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Assessment</th>
          <th>Score</th>
          <th>Grade</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {scores.map((s) => (
          <tr key={s.id}>
            {editingRow === s.id ? (
              <>
                <td>
                  <input
                    value={editData.studentId}
                    onChange={(e) =>
                      setEditData({ ...editData, studentId: e.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    value={editData.studentName}
                    onChange={(e) =>
                      setEditData({ ...editData, studentName: e.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    value={editData.assessment}
                    onChange={(e) =>
                      setEditData({ ...editData, assessment: e.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={editData.score}
                    onChange={(e) =>
                      setEditData({ ...editData, score: e.target.value })
                    }
                  />
                </td>
                <td>{getGrade(editData.score)}</td>
                <td>
                  <button onClick={saveEdit}>💾 Save</button>{" "}
                  <button onClick={() => setEditingRow(null)}>Cancel</button>
                </td>
              </>
            ) : (
              <>
                <td>{s.studentId}</td>
                <td>{s.studentName}</td>
                <td>{s.assessment}</td>
                <td>{s.score}</td>
                <td>{getGrade(s.score)}</td>
                <td>
                  <button onClick={() => startEdit(s)}>✏️ Edit</button>
                  <button className="btn-danger" onClick={() => onDelete(s.id)}>
                    🗑️ Delete
                  </button>
                </td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
