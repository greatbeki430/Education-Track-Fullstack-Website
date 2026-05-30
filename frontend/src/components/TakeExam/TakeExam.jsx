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
import { saveAs } from "file-saver";
import html2pdf from "html2pdf.js";
import "./TakeExam.css";

// ─── helpers ─────────────────────────────────────────────────────────────────

const CHOICE_LABELS = ["A", "B", "C", "D", "E", "F"];

function getChoices(question) {
  if (question.type === "true-false" || question.type === "true/false") {
    return ["True", "False"];
  }
  return question.options || question.choices || [];
}

/**
 * Group questions by type so we can render section headers with
 * a single "each question = X pts" instruction instead of per-question labels.
 * Returns: [ { type, label, pointsEach, questions: [{q, origIdx}] } ]
 */
function groupQuestionsByType(questions) {
  const sections = [];
  let current = null;

  questions.forEach((q, idx) => {
    const type =
      q.type === "true-false" || q.type === "true/false"
        ? "true-false"
        : "multiple-choice";

    if (!current || current.type !== type) {
      current = {
        type,
        label: type === "true-false" ? "True or False" : "Multiple Choice",
        pointsEach: q.points || 1,
        questions: [],
      };
      sections.push(current);
    }
    current.questions.push({ q, origIdx: idx });
  });

  return sections;
}

// ─── STUDENT PRINT HTML ───────────────────────────────────────────────────────

function buildStudentPrintHTML(exam) {
  const title = exam?.title || "Untitled Exam";
  const subject = exam?.subject || "";
  const duration = exam?.duration ? `${exam.duration} minutes` : "";
  const totalPoints =
    exam?.questions?.reduce((s, q) => s + (q.points || 1), 0) || 0;

  const sections = groupQuestionsByType(exam?.questions || []);

  // running question counter across sections
  let globalNum = 0;

  const sectionsHTML = sections
    .map((section) => {
      const sectionQHTML = section.questions
        .map(({ q }) => {
          globalNum++;
          const choices = getChoices(q);
          // NO radio buttons — pure bubble circles
          const choicesHTML = choices.length
            ? `<div class="choices">
                ${choices
                  .map((c, ci) => {
                    const text = typeof c === "string" ? c : c.text || "";
                    return `<div class="choice">
                      <span class="choice-label">${CHOICE_LABELS[ci] || ci + 1}.</span>
                      <span class="choice-bubble"></span>
                      <span class="choice-text">${text}</span>
                    </div>`;
                  })
                  .join("")}
              </div>`
            : `<div class="answer-line"><div class="line"></div><div class="line"></div></div>`;

          return `<div class="question-block">
            <div class="question-header">
              <span class="q-num">${globalNum}.</span>
              <span class="q-text">${q.text || q.question || ""}</span>
            </div>
            ${choicesHTML}
          </div>`;
        })
        .join("");

      return `
        <div class="section-block">
          <div class="section-header">
            <span class="section-label">${section.label}</span>
            <span class="section-pts">(Each question = ${section.pointsEach} pt${section.pointsEach !== 1 ? "s" : ""})</span>
          </div>
          <div class="section-instruction">
            ${
              section.type === "multiple-choice"
                ? "Choose the best answer. Circle or shade the bubble (○) next to your chosen letter."
                : "Write <strong>True</strong> or <strong>False</strong> in the space provided."
            }
          </div>
          ${sectionQHTML}
        </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${title} – Exam Paper</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Times New Roman", Times, serif; font-size: 11pt; color: #111; background: white; }
  .page { max-width: 720px; margin: 0 auto; padding: 2cm 2cm 2.5cm; }

  /* ── Header ── */
  .exam-header { border-bottom: 2.5px solid #111; padding-bottom: 10px; margin-bottom: 16px; }
  .school-name { font-size: 12pt; font-weight: bold; text-align: center; letter-spacing: 1px; text-transform: uppercase; }
  .exam-title  { font-size: 20pt; font-weight: bold; text-align: center; margin: 6px 0 4px; }
  .exam-meta   { display: flex; justify-content: space-between; font-size: 10pt; margin-top: 8px; }

  /* ── Student info box ── */
  .student-info {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 8px 24px; margin: 14px 0 18px;
    border: 1px solid #bbb; padding: 10px 14px; font-size: 10pt;
  }
  .info-field { display: flex; align-items: baseline; gap: 6px; }
  .info-label { font-weight: bold; white-space: nowrap; }
  .info-line  { flex: 1; border-bottom: 1px solid #888; min-width: 80px; height: 18px; }

  /* ── General instructions ── */
  .gen-instructions {
    background: #f7f7f7; border-left: 3px solid #333;
    padding: 8px 12px; font-size: 10pt; margin-bottom: 20px; line-height: 1.6;
  }
  .gen-instructions strong { display: block; margin-bottom: 3px; }

  /* ── Section header ── */
  .section-block { margin-bottom: 24px; }
  .section-header {
    display: flex; align-items: baseline; gap: 10px;
    background: #222; color: white;
    padding: 5px 10px; border-radius: 3px; margin-bottom: 6px;
  }
  .section-label { font-size: 12pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
  .section-pts   { font-size: 9.5pt; opacity: 0.85; }
  .section-instruction {
    font-size: 10pt; font-style: italic; color: #444;
    margin-bottom: 12px; padding-left: 4px;
  }

  /* ── Questions ── */
  .question-block  { margin-bottom: 14px; page-break-inside: avoid; }
  .question-header { display: flex; gap: 6px; align-items: baseline; margin-bottom: 5px; }
  .q-num  { font-weight: bold; min-width: 24px; flex-shrink: 0; }
  .q-text { flex: 1; line-height: 1.55; }

  /* ── Choices – 2-column grid, NO radio inputs ── */
  .choices {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 5px 20px; padding-left: 30px; margin-top: 4px;
  }
  .choice       { display: flex; align-items: center; gap: 7px; font-size: 10.5pt; }
  .choice-label { font-weight: bold; min-width: 18px; flex-shrink: 0; }
  /* Pure CSS bubble — absolutely no HTML form element */
  .choice-bubble {
    width: 13px; height: 13px;
    border: 1.5px solid #444; border-radius: 50%;
    flex-shrink: 0; display: inline-block;
  }
  .choice-text  { line-height: 1.4; }

  /* ── Written answer lines ── */
  .answer-line { padding-left: 30px; }
  .line { border-bottom: 1px solid #888; margin-bottom: 10px; height: 22px; }

  /* ── Footer ── */
  .exam-footer {
    margin-top: 32px; border-top: 1px solid #ccc;
    padding-top: 8px; font-size: 9pt; color: #666; text-align: center;
  }

  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .page { padding: 1.5cm 1.5cm 2cm; }
    .section-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="exam-header">
    <div class="school-name">Meskerem Secondary School – Grade 11</div>
    <div class="exam-title">${title}</div>
    <div class="exam-meta">
      ${subject ? `<span>Subject: <strong>${subject}</strong></span>` : "<span></span>"}
      <span>Total Marks: <strong>${totalPoints}</strong></span>
      ${duration ? `<span>Time Allowed: <strong>${duration}</strong></span>` : ""}
    </div>
  </div>

  <div class="student-info">
    <div class="info-field"><span class="info-label">Full Name:</span><span class="info-line"></span></div>
    <div class="info-field"><span class="info-label">ID No.:</span><span class="info-line"></span></div>
    <div class="info-field"><span class="info-label">Class / Section:</span><span class="info-line"></span></div>
    <div class="info-field"><span class="info-label">Date:</span><span class="info-line"></span></div>
  </div>

  <div class="gen-instructions">
    <strong>General Instructions</strong>
    Read all questions carefully before answering. Answer all questions.
    For multiple-choice, shade or circle the bubble (○) beside the correct letter.
    Write neatly and clearly. Do not use correction fluid without the invigilator's permission.
  </div>

  ${sectionsHTML}

  <div class="exam-footer">
    Generated by EduTrack Ultimate · Meskerem Secondary School – Grade 11
  </div>
</div>
</body>
</html>`;
}

// ─── TEACHER ANSWER KEY HTML ─────────────────────────────────────────────────

function buildTeacherKeyHTML(exam) {
  const title = exam?.title || "Untitled Exam";
  const subject = exam?.subject || "";
  const totalPoints =
    exam?.questions?.reduce((s, q) => s + (q.points || 1), 0) || 0;

  const sections = groupQuestionsByType(exam?.questions || []);

  // Quick-reference answer table rows
  let tableGlobalNum = 0;
  const summaryRows = (exam?.questions || [])
    .map((q) => {
      tableGlobalNum++;
      const choices = getChoices(q);
      const correctRaw = q.correctAnswer || q.correct_answer || q.answer || "";
      const correctIdx = choices.findIndex(
        (c) => c === correctRaw || c?.text === correctRaw,
      );
      const correctLabel =
        correctIdx !== -1
          ? `${CHOICE_LABELS[correctIdx]}. ${
              typeof choices[correctIdx] === "string"
                ? choices[correctIdx]
                : choices[correctIdx].text
            }`
          : correctRaw;
      return `<tr>
        <td>${tableGlobalNum}</td>
        <td>${(q.text || "").substring(0, 65)}${(q.text || "").length > 65 ? "…" : ""}</td>
        <td class="correct-cell">${correctLabel}</td>
        <td>${q.points || 1}</td>
      </tr>`;
    })
    .join("");

  // Detailed sections
  let detailGlobalNum = 0;
  const detailSectionsHTML = sections
    .map((section) => {
      const sectionQHTML = section.questions
        .map(({ q }) => {
          detailGlobalNum++;
          const choices = getChoices(q);
          const correctRaw =
            q.correctAnswer || q.correct_answer || q.answer || "";
          const correctIdx = choices.findIndex(
            (c) => c === correctRaw || c?.text === correctRaw,
          );
          const correctLabel =
            correctIdx !== -1
              ? `${CHOICE_LABELS[correctIdx]}. ${
                  typeof choices[correctIdx] === "string"
                    ? choices[correctIdx]
                    : choices[correctIdx].text
                }`
              : correctRaw;

          const choicesHTML = choices.length
            ? `<div class="choices">
                ${choices
                  .map((c, ci) => {
                    const text = typeof c === "string" ? c : c.text || "";
                    const isCorrect =
                      ci === correctIdx ||
                      c === correctRaw ||
                      c?.text === correctRaw;
                    return `<div class="choice ${isCorrect ? "correct" : ""}">
                      <span class="choice-label">${CHOICE_LABELS[ci] || ci + 1}.</span>
                      <span class="choice-text">${text}</span>
                      ${isCorrect ? '<span class="tick">✓</span>' : ""}
                    </div>`;
                  })
                  .join("")}
              </div>`
            : "";

          const explanation =
            q.explanation ||
            q.reason ||
            q.rationale ||
            `The correct answer is <strong>${correctLabel}</strong>.`;

          return `<div class="question-block">
            <div class="question-header">
              <span class="q-num">${detailGlobalNum}.</span>
              <span class="q-text">${q.text || q.question || ""}</span>
            </div>
            ${choicesHTML}
            <div class="answer-box">
              <div class="answer-row">
                <span class="answer-badge">✓ Correct Answer:</span>
                <span class="answer-value">${correctLabel}</span>
              </div>
              <div class="explanation">
                <span class="exp-label">📝 Explanation:</span>
                <span>${explanation}</span>
              </div>
            </div>
          </div>`;
        })
        .join("");

      return `
        <div class="section-block">
          <div class="section-header">
            <span class="section-label">${section.label}</span>
            <span class="section-pts">Each question = ${section.pointsEach} pt${section.pointsEach !== 1 ? "s" : ""}</span>
          </div>
          ${sectionQHTML}
        </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${title} – Teacher Answer Key</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Times New Roman", Times, serif; font-size: 11pt; color: #111; background: white; }
  .page { max-width: 720px; margin: 0 auto; padding: 2cm 2cm 2.5cm; }

  /* ── Header ── */
  .exam-header { background: #1e466e; color: white; padding: 16px 20px; border-radius: 6px; margin-bottom: 20px; }
  .confidential-badge {
    background: #e53e3e; color: white; font-size: 9pt; font-weight: bold;
    letter-spacing: 2px; padding: 3px 10px; border-radius: 3px;
    display: inline-block; margin-bottom: 8px;
  }
  .school-name { font-size: 11pt; opacity: 0.82; }
  .exam-title  { font-size: 18pt; font-weight: bold; margin: 4px 0 6px; }
  .exam-meta   { display: flex; gap: 24px; font-size: 10pt; opacity: 0.88; }

  /* ── Section titles ── */
  .page-section-title {
    font-size: 13pt; font-weight: bold; margin: 22px 0 10px;
    color: #1e466e; border-bottom: 2px solid #1e466e; padding-bottom: 4px;
  }

  /* ── Quick-ref table ── */
  table { width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 28px; }
  th { background: #2c7da0; color: white; padding: 7px 10px; text-align: left; }
  td { padding: 6px 10px; border-bottom: 1px solid #e0e0e0; vertical-align: top; }
  tr:nth-child(even) td { background: #f5f9fc; }
  .correct-cell { color: #15803d; font-weight: bold; }

  /* ── Section header ── */
  .section-block { margin-bottom: 24px; }
  .section-header {
    display: flex; align-items: baseline; gap: 10px;
    background: #1e466e; color: white;
    padding: 5px 10px; border-radius: 3px; margin-bottom: 10px;
  }
  .section-label { font-size: 12pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
  .section-pts   { font-size: 9.5pt; opacity: 0.85; }

  /* ── Questions ── */
  .question-block {
    margin-bottom: 20px; page-break-inside: avoid;
    border-left: 3px solid #2c7da0; padding-left: 12px;
  }
  .question-header { display: flex; gap: 6px; align-items: baseline; margin-bottom: 7px; }
  .q-num  { font-weight: bold; min-width: 24px; color: #1e466e; flex-shrink: 0; }
  .q-text { flex: 1; line-height: 1.55; }

  /* ── Choices ── */
  .choices { padding-left: 22px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 3px; }
  .choice         { display: flex; align-items: center; gap: 6px; font-size: 10.5pt; padding: 2px 0; }
  .choice.correct { color: #15803d; font-weight: bold; }
  .choice-label   { font-weight: bold; min-width: 20px; flex-shrink: 0; }
  .tick           { margin-left: 4px; font-size: 12pt; }

  /* ── Answer / explanation box ── */
  .answer-box {
    background: #f0faf4; border: 1px solid #86efac;
    border-radius: 5px; padding: 10px 14px; font-size: 10pt; margin-top: 6px;
  }
  .answer-row   { display: flex; gap: 10px; align-items: center; margin-bottom: 6px; }
  .answer-badge {
    background: #15803d; color: white; font-size: 9pt; font-weight: bold;
    padding: 1px 8px; border-radius: 10px; white-space: nowrap;
  }
  .answer-value { font-weight: bold; color: #15803d; }
  .exp-label    { font-weight: bold; margin-right: 6px; }
  .explanation  { line-height: 1.55; color: #374151; }

  /* ── Footer ── */
  .exam-footer {
    margin-top: 30px; border-top: 1px solid #ccc;
    padding-top: 10px; font-size: 9pt; color: #888; text-align: center;
  }

  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .page { padding: 1.5cm; }
    .exam-header, .section-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="page">

  <div class="exam-header">
    <div class="confidential-badge">🔒 TEACHER ONLY – CONFIDENTIAL</div>
    <div class="school-name">Meskerem Secondary School – Grade 11</div>
    <div class="exam-title">${title} – Answer Key</div>
    <div class="exam-meta">
      ${subject ? `<span>Subject: ${subject}</span>` : ""}
      <span>Total Marks: ${totalPoints}</span>
      <span>Questions: ${exam?.questions?.length || 0}</span>
    </div>
  </div>

  <div class="page-section-title">📊 Quick Reference Answer Table</div>
  <table>
    <thead>
      <tr><th>#</th><th>Question (Preview)</th><th>Correct Answer</th><th>Pts</th></tr>
    </thead>
    <tbody>${summaryRows}</tbody>
  </table>

  <div class="page-section-title">📝 Detailed Questions &amp; Explanations</div>
  ${detailSectionsHTML}

  <div class="exam-footer">
    Generated by EduTrack Ultimate · ${new Date().toLocaleString()} · DO NOT DISTRIBUTE TO STUDENTS
  </div>
</div>
</body>
</html>`;
}

// ─── DIGITAL REPORT HTML (replaces old table-based PDF/Word) ─────────────────

/**
 * Renders a question-and-options format (not a spreadsheet table).
 * Used for both the PDF Report and the Word doc exports.
 */
function buildDigitalReportHTML(exam, answers, markedQuestions, user) {
  const studentName = user?.fullName || user?.username || "Student";
  const studentId = user?.studentId || user?.id || "N/A";
  const examTitle = exam?.title || "Untitled Exam";
  const date = new Date().toLocaleString();
  const totalQuestions = exam?.questions?.length || 0;
  const answeredCount = Object.keys(answers).length;
  const markedCount = Object.values(markedQuestions).filter(Boolean).length;
  const completionRate =
    totalQuestions > 0
      ? ((answeredCount / totalQuestions) * 100).toFixed(1)
      : "0.0";

  const sections = groupQuestionsByType(exam?.questions || []);
  let globalNum = 0;

  const sectionsHTML = sections
    .map((section) => {
      const sectionQHTML = section.questions
        .map(({ q, origIdx }) => {
          globalNum++;
          const choices = getChoices(q);
          const userAns = answers[origIdx];
          const correct = q.correctAnswer || q.correct_answer || q.answer || "";
          const isMarked = markedQuestions[origIdx];

          const choicesHTML = choices.length
            ? choices
                .map((c, ci) => {
                  const text = typeof c === "string" ? c : c.text || "";
                  const isSelected = c === userAns || c?.text === userAns;
                  const isCorrect = c === correct || c?.text === correct;
                  let style =
                    "padding:3px 8px; border-radius:4px; margin-bottom:3px; display:flex; gap:8px; align-items:center; font-size:10pt;";
                  if (isSelected && isCorrect)
                    style +=
                      "background:#dcfce7; font-weight:bold; color:#15803d;";
                  else if (isSelected && !isCorrect)
                    style += "background:#fee2e2; color:#dc2626;";
                  else if (!isSelected && isCorrect)
                    style += "background:#f0fdf4; color:#166534;";

                  return `<div style="${style}">
                    <strong>${CHOICE_LABELS[ci] || ci + 1}.</strong>
                    <span>${text}</span>
                    ${isSelected && isCorrect ? "<span style='margin-left:auto'>✓ Your answer</span>" : ""}
                    ${isSelected && !isCorrect ? "<span style='margin-left:auto'>✗ Your answer</span>" : ""}
                    ${!isSelected && isCorrect ? "<span style='margin-left:auto; font-size:9pt; opacity:0.8'>← Correct</span>" : ""}
                  </div>`;
                })
                .join("")
            : `<div style="padding:4px 8px; color:#999; font-size:10pt;">(Not answered)</div>`;

          return `<div style="margin-bottom:16px; page-break-inside:avoid; border-left:3px solid ${!userAns ? "#f59e0b" : userAns === correct ? "#22c55e" : "#ef4444"}; padding-left:12px;">
            <div style="display:flex; gap:8px; align-items:baseline; margin-bottom:6px;">
              <strong style="min-width:24px; color:#1e466e;">${globalNum}.</strong>
              <span style="flex:1; line-height:1.5;">${q.text || q.question || ""}</span>
              ${isMarked ? '<span style="background:#fbbf24; color:#111; font-size:9pt; padding:1px 7px; border-radius:10px; white-space:nowrap;">📌 Marked</span>' : ""}
            </div>
            <div style="padding-left:22px;">${choicesHTML}</div>
          </div>`;
        })
        .join("");

      return `
        <div style="margin-bottom:22px;">
          <div style="background:#1e466e; color:white; padding:5px 12px; border-radius:3px; display:flex; gap:10px; margin-bottom:10px; align-items:baseline;">
            <strong style="font-size:11pt; text-transform:uppercase; letter-spacing:0.5px;">${section.label}</strong>
            <span style="font-size:9.5pt; opacity:0.85;">(Each question = ${section.pointsEach} pt${section.pointsEach !== 1 ? "s" : ""})</span>
          </div>
          ${sectionQHTML}
        </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${examTitle} – Exam Report</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 760px; margin: 0 auto; padding: 2rem; color: #111;">

  <div style="text-align:center; margin-bottom:24px;">
    <h1 style="color:#1e466e; margin-bottom:4px;">${examTitle}</h1>
    <h2 style="color:#2c7da0; font-size:15pt; font-weight:normal;">Exam Report</h2>
  </div>

  <div style="background:#f0f2f5; padding:14px 18px; border-radius:8px; margin-bottom:18px; font-size:10.5pt;">
    <h3 style="margin-bottom:10px; color:#1e466e;">Student Information</h3>
    <div style="display:grid; grid-template-columns:120px 1fr; gap:6px 0;">
      <strong>Name:</strong><span>${studentName}</span>
      <strong>Student ID:</strong><span>${studentId}</span>
      <strong>Date:</strong><span>${date}</span>
    </div>
  </div>

  <div style="background:#e1f0f7; padding:12px 18px; border-radius:8px; margin-bottom:24px; font-size:10.5pt;">
    <h3 style="margin-bottom:10px; color:#1e466e;">Summary</h3>
    <div style="display:flex; gap:12px; flex-wrap:wrap;">
      <div style="background:white; padding:6px 14px; border-radius:8px;">📊 Total: <strong>${totalQuestions}</strong></div>
      <div style="background:white; padding:6px 14px; border-radius:8px;">✅ Answered: <strong>${answeredCount}</strong></div>
      <div style="background:white; padding:6px 14px; border-radius:8px;">❌ Unanswered: <strong>${totalQuestions - answeredCount}</strong></div>
      <div style="background:white; padding:6px 14px; border-radius:8px;">📌 Marked: <strong>${markedCount}</strong></div>
      <div style="background:white; padding:6px 14px; border-radius:8px;">📈 Completion: <strong>${completionRate}%</strong></div>
    </div>
  </div>

  ${sectionsHTML}

  <div style="margin-top:30px; border-top:1px solid #ddd; padding-top:10px; font-size:9pt; color:#888; text-align:center;">
    Generated by EduTrack Ultimate on ${date} · Meskerem Secondary School – Grade 11
  </div>
</body>
</html>`;
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

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
  const [showReviewMode, setShowReviewMode] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    fetchExam();
  }, [id]);

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingButton(!sidebarOpen && window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sidebarOpen]);

  // Listen for export events dispatched from Navigation.jsx
  useEffect(() => {
    const handler = (e) => {
      const { format } = e.detail;
      switch (format) {
        case "print-student":
          exportStudentPrint();
          break;
        case "print-teacher":
          exportTeacherKey();
          break;
        case "pdf":
          exportToPDF();
          break;
        case "word":
          exportToWord();
          break;
        default:
          break;
      }
    };
    window.addEventListener("exportExam", handler);
    return () => window.removeEventListener("exportExam", handler);
  }, [exam, answers, markedQuestions]);

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
      if (percentage >= 50) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }

      setReviewResult(result.data);
      setInfoModalConfig({
        type: "success",
        title: "Exam Submitted! 🎉",
        message: `Your score: ${result.data.score}/${result.data.total}\nPercentage: ${percentage}%`,
        autoClose: 4000,
      });
      setShowInfoModal(true);
      setTimeout(() => setShowReviewMode(true), 1500);
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

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const openSubmitModal = () => setShowSubmitModal(true);

  // ── Teacher print exports ──────────────────────────────────────────────────

  const exportStudentPrint = () => {
    if (!exam) return;
    html2pdf()
      .set({
        margin: [1, 1.5, 1, 1.5],
        filename: `${exam.title || "Exam"}_StudentPaper_${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: "jpeg", quality: 0.99 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "cm", format: "a4", orientation: "portrait" },
      })
      .from(buildStudentPrintHTML(exam))
      .save();
  };

  const exportTeacherKey = () => {
    if (!exam) return;
    html2pdf()
      .set({
        margin: [1, 1.5, 1, 1.5],
        filename: `${exam.title || "Exam"}_TeacherKey_CONFIDENTIAL_${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: "jpeg", quality: 0.99 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "cm", format: "a4", orientation: "portrait" },
      })
      .from(buildTeacherKeyHTML(exam))
      .save();
  };

  // ── Digital report exports (questions+options format, no tables) ───────────

  const exportToPDF = () => {
    if (!exam) return;
    const html = buildDigitalReportHTML(exam, answers, markedQuestions, user);
    html2pdf()
      .set({
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `${exam.title || "Exam"}_Report_${new Date().toISOString().slice(0, 19)}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      })
      .from(html)
      .save();
  };

  const exportToWord = () => {
    if (!exam) return;
    const html = buildDigitalReportHTML(exam, answers, markedQuestions, user);
    const blob = new Blob([html], { type: "application/msword" });
    saveAs(
      blob,
      `${exam.title || "Exam"}_Report_${new Date().toISOString().slice(0, 19)}.doc`,
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) return <LoadingSpinner text="Loading exam..." />;
  if (!exam) return <div className="error-container">Exam not found</div>;

  const progress = calculateProgress(answers, exam.questions);
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = exam.questions?.length || 0;

  // ── Review mode (post-submission) ─────────────────────────────────────────
  if (showReviewMode && reviewResult) {
    const percentage = parseFloat(reviewResult.percentage || 0);
    const passed = percentage >= 50;
    const sections = groupQuestionsByType(exam.questions || []);
    let reviewGlobalNum = 0;

    return (
      <div className="review-mode-container">
        <div
          className="review-header"
          style={{
            background: passed
              ? "linear-gradient(135deg,#15803d,#166534)"
              : "linear-gradient(135deg,#dc2626,#991b1b)",
          }}
        >
          <div className="review-score-badge">
            <span className="review-emoji">{passed ? "🎉" : "📚"}</span>
            <span className="review-score">
              {reviewResult.score}/{reviewResult.total}
            </span>
            <span className="review-percent">{percentage}%</span>
          </div>
          <h2 className="review-title">
            {passed ? "Great Work!" : "Keep Practicing!"}
          </h2>
          <p className="review-subtitle">{exam.title}</p>
        </div>

        <div className="review-questions">
          {sections.map((section, si) => (
            <div key={si} className="review-section">
              <div className="review-section-header">
                <span>{section.label}</span>
                <span className="review-section-pts">
                  Each question = {section.pointsEach} pt
                  {section.pointsEach !== 1 ? "s" : ""}
                </span>
              </div>

              {section.questions.map(({ q, origIdx }) => {
                reviewGlobalNum++;
                const choices = getChoices(q);
                const correct = q.correctAnswer || q.correct_answer || "";
                const userAns = answers[origIdx];
                const isCorrect = userAns === correct;
                const isUnanswered = !userAns;

                return (
                  <div
                    key={origIdx}
                    className={`review-card ${
                      isCorrect
                        ? "correct"
                        : isUnanswered
                          ? "unanswered"
                          : "incorrect"
                    }`}
                  >
                    <div className="review-q-header">
                      <span className="review-q-num">Q{reviewGlobalNum}</span>
                      <span className="review-q-text">{q.text}</span>
                      <span
                        className={`review-status-badge ${
                          isCorrect
                            ? "badge-correct"
                            : isUnanswered
                              ? "badge-skip"
                              : "badge-wrong"
                        }`}
                      >
                        {isCorrect
                          ? "✓ Correct"
                          : isUnanswered
                            ? "— Skipped"
                            : "✗ Wrong"}
                      </span>
                    </div>
                    {choices.length > 0 && (
                      <div className="review-choices">
                        {choices.map((c, ci) => {
                          const text = typeof c === "string" ? c : c.text;
                          const isC = c === correct || c?.text === correct;
                          const isU = c === userAns || c?.text === userAns;
                          return (
                            <div
                              key={ci}
                              className={`review-choice ${isC ? "choice-correct" : ""} ${
                                isU && !isC ? "choice-wrong" : ""
                              }`}
                            >
                              <span className="review-choice-label">
                                {CHOICE_LABELS[ci]}.
                              </span>
                              <span>{text}</span>
                              {isC && (
                                <span className="rc-badge correct-badge">
                                  ✓ Correct
                                </span>
                              )}
                              {isU && !isC && (
                                <span className="rc-badge wrong-badge">
                                  Your Answer
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {(q.explanation || q.reason) && (
                      <div className="review-explanation">
                        <span className="exp-icon">💡</span>
                        <span>{q.explanation || q.reason}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="review-actions">
          <button className="btn-primary" onClick={() => navigate("/exams")}>
            ← Back to Exams
          </button>
          <button className="btn-secondary" onClick={() => window.print()}>
            🖨️ Print Review
          </button>
        </div>
      </div>
    );
  }

  // ── Main exam view ─────────────────────────────────────────────────────────
  return (
    <div className={`take-exam-container ${focusMode ? "focus-mode" : ""}`}>
      <button
        className={`sidebar-toggle ${!sidebarOpen ? "open" : ""}`}
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? "◀" : "▶"}
      </button>

      {!focusMode && (
        <button
          className="focus-mode-btn"
          onClick={() => setFocusMode(true)}
          title="Enter Focus Mode"
        >
          🎯
        </button>
      )}
      {focusMode && (
        <button
          className="focus-mode-btn focus-exit"
          onClick={() => setFocusMode(false)}
          title="Exit Focus Mode"
        >
          ✕ Exit Focus
        </button>
      )}

      {!sidebarOpen && !submitted && (
        <button
          className={`floating-submit-btn ${showFloatingButton ? "visible" : ""}`}
          onClick={openSubmitModal}
        >
          📤 Submit
        </button>
      )}

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

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

      <ConfirmationModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={handleSubmit}
        title="Submit Exam"
        message={`Are you sure you want to submit your exam?\n\nYou have answered ${answeredCount} out of ${totalQuestions} questions.\n${
          totalQuestions - answeredCount
        } questions remaining.\n\nOnce submitted, you cannot change your answers.`}
      />

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
