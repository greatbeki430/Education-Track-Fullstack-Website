import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the notes file from the parent directory
const notesPath = path.join(__dirname, "..", "web_development_notes.txt");
const outputPath = path.join(__dirname, "..", "web_development_notes.html");

console.log("Looking for notes file at:", notesPath);

// Check if file exists
if (!fs.existsSync(notesPath)) {
  console.error("❌ Notes file not found!");
  console.log(
    "Please create web_development_notes.txt in the backend folder first.",
  );
  process.exit(1);
}

// Read the notes file
let notesContent = fs.readFileSync(notesPath, "utf8");

// Clean the markdown formatting
function cleanMarkdown(text) {
  return (
    text
      // Remove # symbols from headings (## Chapter -> Chapter)
      .replace(/^##+\s+/gm, "")
      // Remove **bold** markers but keep the text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      // Remove *italic* markers
      .replace(/\*(.*?)\*/g, "$1")
      // Convert code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/g, "<pre><code>$2</code></pre>")
      // Convert inline code
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      // Convert lists (lines starting with - or numbers)
      .replace(/^(\d+)\.\s+(.+)$/gm, "<li>$2</li>")
      .replace(/^-\s+(.+)$/gm, "<li>$1</li>")
      // Wrap consecutive list items in ul/ol
      .replace(/(<li>.*?<\/li>\n?)+/gs, (match) => {
        if (match.match(/<li>.*?<\/li>/)) {
          return `<ul>${match}</ul>`;
        }
        return match;
      })
  );
}

// Process the content line by line for better heading handling
const lines = notesContent.split("\n");
let processedLines = [];
let inCodeBlock = false;

for (let line of lines) {
  // Check for code blocks
  if (line.trim().startsWith("```")) {
    inCodeBlock = !inCodeBlock;
    if (!inCodeBlock) {
      processedLines.push("</pre></code>");
    } else {
      processedLines.push("<pre><code>");
    }
    continue;
  }

  if (inCodeBlock) {
    processedLines.push(line);
    continue;
  }

  // Process headings (remove # symbols)
  if (line.match(/^#{1,6}\s/)) {
    // Count the number of # symbols to determine heading level
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const headingText = match[2];
      const tag = `h${Math.min(level, 6)}`;
      processedLines.push(`<${tag}>${headingText}</${tag}>`);
      continue;
    }
  }

  // Process bold text
  line = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Process italic text
  line = line.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Process inline code
  line = line.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Process list items
  if (line.match(/^\d+\.\s/)) {
    line = line.replace(/^\d+\.\s(.+)$/, "<li>$1</li>");
  } else if (line.match(/^-\s/)) {
    line = line.replace(/^-\s(.+)$/, "<li>$1</li>");
  }

  // Process empty lines
  if (line.trim() === "") {
    processedLines.push("<br>");
  } else {
    // Only wrap in paragraph if it's not already a block element
    if (
      !line.startsWith("<h") &&
      !line.startsWith("<li") &&
      !line.startsWith("<ul") &&
      !line.startsWith("<pre") &&
      !line.startsWith("<code") &&
      !line.startsWith("</")
    ) {
      processedLines.push(`<p>${line}</p>`);
    } else {
      processedLines.push(line);
    }
  }
}

let cleanedContent = processedLines.join("\n");

// Wrap lists properly
cleanedContent = cleanedContent.replace(/(<li>.*?<\/li>\n?)+/gs, (match) => {
  return `<ul>${match}</ul>`;
});

// Create HTML content
const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Web Design and Development - Grade 11 Notes</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 40px;
            background: white;
        }
        h1 {
            color: #2c7da0;
            border-bottom: 3px solid #2c7da0;
            padding-bottom: 10px;
            margin-top: 30px;
            margin-bottom: 20px;
            font-size: 28px;
        }
        h2 {
            color: #1e466e;
            margin-top: 25px;
            margin-bottom: 15px;
            border-left: 4px solid #2c7da0;
            padding-left: 15px;
            font-size: 22px;
        }
        h3 {
            color: #2c7da0;
            margin-top: 20px;
            margin-bottom: 10px;
            font-size: 18px;
        }
        h4 {
            color: #555;
            margin-top: 15px;
            margin-bottom: 10px;
            font-size: 16px;
        }
        code {
            background: #f4f4f4;
            padding: 2px 5px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        pre {
            background: #f4f4f4;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            margin: 15px 0;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            border-left: 4px solid #2c7da0;
        }
        pre code {
            background: none;
            padding: 0;
        }
        ul, ol {
            margin-left: 30px;
            margin-bottom: 15px;
        }
        li {
            margin-bottom: 5px;
        }
        p {
            margin-bottom: 10px;
            line-height: 1.6;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #2c7da0;
        }
        .header h1 {
            border: none;
            font-size: 32px;
            margin-bottom: 10px;
            color: #2c7da0;
        }
        .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 0.9em;
            color: #666;
        }
        .review-questions {
            background: #f0f7ff;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        .review-questions h2 {
            margin-top: 0;
        }
        strong {
            color: #2c7da0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📚 Web Design and Development</h1>
            <p>Grade 11 - Complete Study Notes</p>
        </div>
        
        ${cleanedContent}
        
        <div class="footer">
            <p>Generated by EduTrack System | Grade 11 Web Development Notes</p>
            <p>Use these notes to prepare for your web development exam!</p>
        </div>
    </div>
</body>
</html>`;

// Write the HTML file
fs.writeFileSync(outputPath, htmlContent);
console.log("✅ HTML file created at:", outputPath);
console.log("📝 The # symbols have been removed from headings");
console.log("🎯 You can now:");
console.log("   1. Open the HTML file in your browser");
console.log("   2. Press Ctrl+P (or Cmd+P on Mac)");
console.log('   3. Choose "Save as PDF"');
console.log("   4. Your PDF will have clean, professional formatting!");
