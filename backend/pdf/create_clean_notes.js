import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const notesPath = path.join(__dirname, "..", "web_development_notes.txt");
const outputPath = path.join(
  __dirname,
  "..",
  "web_development_notes_clean.html",
);

let content = fs.readFileSync(notesPath, "utf8");

// Remove all markdown heading markers (#)
content = content.replace(/^#{1,6}\s+/gm, "");

// Remove bold markers
content = content.replace(/\*\*/g, "");

// Remove italic markers
content = content.replace(/\*/g, "");

// Convert to HTML
const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Web Design and Development - Grade 11</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #2c7da0; border-bottom: 2px solid #2c7da0; }
        h2 { color: #1e466e; margin-top: 30px; }
        code { background: #f4f4f4; padding: 2px 5px; }
        pre { background: #f4f4f4; padding: 10px; }
    </style>
</head>
<body>
    <h1>Web Design and Development - Grade 11 Notes</h1>
    <pre style="white-space: pre-wrap; font-family: inherit;">${content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
</body>
</html>`;

fs.writeFileSync(outputPath, html);
console.log("✅ Clean HTML created at:", outputPath);
