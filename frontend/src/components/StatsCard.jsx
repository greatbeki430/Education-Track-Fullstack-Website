export default function StatsCard({ scores }) {
  if (!scores.length) return <div>No data</div>;
  const avg = (scores.reduce((a, b) => a + b.score, 0) / scores.length).toFixed(
    1,
  );
  const max = Math.max(...scores.map((s) => s.score));
  const min = Math.min(...scores.map((s) => s.score));
  const uniqueStudents = new Set(scores.map((s) => s.studentId)).size;
  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        flexWrap: "wrap",
        marginTop: "1rem",
      }}
    >
      <div className="card" style={{ flex: 1, textAlign: "center" }}>
        📊 Avg: {avg}
      </div>
      <div className="card" style={{ flex: 1, textAlign: "center" }}>
        🏆 Max: {max}
      </div>
      <div className="card" style={{ flex: 1, textAlign: "center" }}>
        📉 Min: {min}
      </div>
      <div className="card" style={{ flex: 1, textAlign: "center" }}>
        👥 Students: {uniqueStudents}
      </div>
    </div>
  );
}
