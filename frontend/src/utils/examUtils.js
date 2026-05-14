// Strip HTML tags
export const stripHtmlTags = (html) => {
  if (!html) return "";
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
};

// Calculate progress percentage
export const calculateProgress = (answers, questions) => {
  if (!questions || questions.length === 0) return 0;
  const answeredCount = Object.keys(answers).length;
  return (answeredCount / questions.length) * 100;
};

// Export questions to JSON
export const exportToJSON = (exam, answers) => {
  const data = {
    examTitle: exam.title,
    submittedAt: new Date().toISOString(),
    answers: answers,
    totalQuestions: exam.questions?.length,
    answeredCount: Object.keys(answers).length,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${exam.title.replace(/\s+/g, "_")}_answers.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Export to CSV
export const exportToCSV = (exam, answers) => {
  const headers = ["Question", "Your Answer", "Correct Answer", "Status"];
  const rows = exam.questions.map((q, idx) => [
    stripHtmlTags(q.text),
    answers[idx] || "Not answered",
    q.correctAnswer,
    answers[idx] === q.correctAnswer ? "✓ Correct" : "✗ Incorrect",
  ]);

  const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${exam.title.replace(/\s+/g, "_")}_results.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// Calculate score
export const calculateScore = (exam, answers) => {
  if (!exam?.questions) return { score: 0, total: 0, percentage: 0 };

  let score = 0;
  let total = 0;

  exam.questions.forEach((q, idx) => {
    const points = q.points || 1;
    total += points;
    if (
      answers[idx] &&
      answers[idx].toLowerCase() === q.correctAnswer.toLowerCase()
    ) {
      score += points;
    }
  });

  return {
    score,
    total,
    percentage: ((score / total) * 100).toFixed(1),
  };
};
