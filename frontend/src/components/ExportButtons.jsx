import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import html2pdf from "html2pdf.js";

export default function ExportButtons({ scores }) {
  const exportExcel = () => {
    const data = scores.map((s) => ({
      ID: s.studentId,
      Name: s.studentName,
      Assessment: s.assessment,
      Score: s.score,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Grades");
    XLSX.writeFile(wb, `grades_${Date.now()}.xlsx`);
  };

  const exportCSV = () => {
    let csv =
      "Student ID,Name,Assessment,Score\n" +
      scores
        .map(
          (s) => `${s.studentId},${s.studentName},${s.assessment},${s.score}`,
        )
        .join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    saveAs(blob, `grades_${Date.now()}.csv`);
  };

  const exportPDF = () => {
    const element = document.createElement("div");
    element.innerHTML = `<h2>Grade Report - ${new Date().toLocaleString()}</h2>${document.querySelector("table").outerHTML}`;
    html2pdf().from(element).save();
  };

  const exportWord = () => {
    const html = `<html><body><h2>EduTrack Pro Report</h2>${document.querySelector("table").outerHTML}</body></html>`;
    const blob = new Blob([html], { type: "application/msword" });
    saveAs(blob, `report_${Date.now()}.doc`);
  };

  return (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      <button className="btn-outline" onClick={exportExcel}>
        📎 Excel
      </button>
      <button className="btn-outline" onClick={exportCSV}>
        📄 CSV
      </button>
      <button className="btn-outline" onClick={exportPDF}>
        📑 PDF
      </button>
      <button className="btn-outline" onClick={exportWord}>
        📝 Word
      </button>
    </div>
  );
}
