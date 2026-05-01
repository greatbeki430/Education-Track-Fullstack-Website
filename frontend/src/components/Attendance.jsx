import React, { useState, useEffect } from "react";
import api from "../api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import html2pdf from "html2pdf.js";

export default function Attendance() {
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [saving, setSaving] = useState(false);

  // Mock students - in real app, fetch from DB
  const mockStudents = [
    { id: "G11-001", name: "Abebe Kebede" },
    { id: "G11-002", name: "Bekele Alemu" },
    { id: "G11-003", name: "Chaltu Mohammed" },
    { id: "G11-004", name: "Dawit Tsegaye" },
    { id: "G11-005", name: "Eden Girmay" },
  ];

  useEffect(() => {
    loadAttendanceForDate();
  }, [selectedDate]);

  const loadAttendanceForDate = async () => {
    try {
      const res = await api.get(`/attendance?date=${selectedDate}`);
      const records = res.data;
      const statusMap = {};
      records.forEach((r) => {
        statusMap[r.studentId] = r.status;
      });
      setAttendanceRecords(statusMap);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords({ ...attendanceRecords, [studentId]: status });
  };

  const saveAttendance = async () => {
    setSaving(true);
    const records = mockStudents.map((s) => ({
      studentId: s.id,
      studentName: s.name,
      date: selectedDate,
      status: attendanceRecords[s.id] || "absent",
      class: "Grade 11",
    }));

    try {
      await api.post("/attendance", { records });
      alert("Attendance saved successfully!");
    } catch (err) {
      alert("Error saving attendance");
    } finally {
      setSaving(false);
    }
  };

  const exportAttendancePDF = () => {
    const element = document.createElement("div");
    element.innerHTML = `
      <h2>Attendance Report - ${selectedDate}</h2>
      <table border="1">
        <thead><tr><th>Student ID</th><th>Student Name</th><th>Status</th></tr></thead>
        <tbody>
          ${mockStudents
            .map(
              (s) => `
            <tr>
              <td>${s.id}</td>
              <td>${s.name}</td>
              <td>${attendanceRecords[s.id] || "absent"}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    `;
    html2pdf().from(element).save();
  };

  const exportAttendanceExcel = () => {
    const data = mockStudents.map((s) => ({
      "Student ID": s.id,
      "Student Name": s.name,
      Status: attendanceRecords[s.id] || "absent",
      Date: selectedDate,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `attendance_${selectedDate}.xlsx`);
  };

  return (
    <div className="container">
      <div className="card">
        <h2>📋 Daily Attendance Tracker</h2>
        <div className="form-group">
          <label>Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <button onClick={saveAttendance} disabled={saving} className="btn">
            {saving ? "Saving..." : "💾 Save Attendance"}
          </button>
          <button onClick={exportAttendancePDF} className="btn-outline">
            📑 PDF Report
          </button>
          <button onClick={exportAttendanceExcel} className="btn-outline">
            📊 Excel Report
          </button>
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Student Name</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Late</th>
            </tr>
          </thead>
          <tbody>
            {mockStudents.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.name}</td>
                <td>
                  <input
                    type="radio"
                    name={`status-${s.id}`}
                    checked={attendanceRecords[s.id] === "present"}
                    onChange={() => handleStatusChange(s.id, "present")}
                  />
                </td>
                <td>
                  <input
                    type="radio"
                    name={`status-${s.id}`}
                    checked={attendanceRecords[s.id] === "absent"}
                    onChange={() => handleStatusChange(s.id, "absent")}
                  />
                </td>
                <td>
                  <input
                    type="radio"
                    name={`status-${s.id}`}
                    checked={attendanceRecords[s.id] === "late"}
                    onChange={() => handleStatusChange(s.id, "late")}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
