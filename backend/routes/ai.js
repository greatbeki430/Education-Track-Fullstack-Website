import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mammoth from "mammoth";
import { extractTextFromFile, getFileInfo } from "../services/fileExtractor.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const router = express.Router();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Adaptive rate limiting variables
let globalRequestCount = 0;
let globalLastReset = Date.now();
let currentMaxChars = 12000; // Start with 12,000 chars
let consecutiveRateLimits = 0;
let lastReductionTime = Date.now();

// Gemini API URL
const GEMINI_URL = () =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

// ─── Multer Setup ─────────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(
      __dirname,
      "../" + (process.env.UPLOAD_DIR || "uploads"),
    );
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".docx", ".txt"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(
      new Error(
        "Invalid file type. Only PDF, DOCX, and TXT files are allowed.",
      ),
    );
  },
});

// ─── Text Extraction ──────────────────────────────────────────────────────────

// async function extractTextFromFile(filePath, originalName) {
//   const ext = path.extname(originalName).toLowerCase();
//   console.log(`📄 Extracting text from: ${originalName} (${ext})`);

//   try {
//     if (ext === ".pdf") {
//       // PDF support is temporarily disabled
//       throw new Error(
//         "📄 PDF support is currently being configured.\n\n" +
//           "Please convert your PDF to TXT format:\n" +
//           "1. Open the PDF file\n" +
//           "2. Select all text (Ctrl+A)\n" +
//           "3. Copy the text (Ctrl+C)\n" +
//           "4. Paste into a new text file\n" +
//           "5. Save as .txt file\n" +
//           "6. Upload the TXT file instead\n\n" +
//           "You can also use DOCX (Word) files - they work perfectly!",
//       );
//     } else if (ext === ".docx") {
//       const dataBuffer = fs.readFileSync(filePath);
//       const result = await mammoth.extractRawText({ buffer: dataBuffer });
//       console.log(`✅ DOCX parsed: ${result.value.length} chars`);
//       return result.value;
//     } else if (ext === ".txt") {
//       const text = fs.readFileSync(filePath, "utf8");
//       console.log(`✅ TXT read: ${text.length} chars`);
//       return text;
//     } else {
//       throw new Error(`Unsupported file format: ${ext}`);
//     }
//   } catch (error) {
//     console.error("❌ Text extraction error:", error);
//     throw new Error(`Failed to extract text: ${error.message}`);
//   }
// }

// ─── Gemini API Helper ────────────────────────────────────────────────────────

async function callGemini(prompt, maxOutputTokens = 4096) {
  // Rate limiting check
  if (Date.now() - globalLastReset > 60000) {
    globalRequestCount = 0;
    globalLastReset = Date.now();
  }

  if (globalRequestCount >= 50) {
    console.log("⏳ Rate limit approaching, waiting 5 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  globalRequestCount++;
  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not set in .env. Please add it and restart the server.",
    );
  }

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: maxOutputTokens,
      responseMimeType: "application/json", // Keep this for v1beta
    },
  };

  console.log(`🤖 Calling Gemini API...`);

  const response = await fetch(GEMINI_URL(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const msg =
      errorBody?.error?.message || `Gemini API error ${response.status}`;
    console.error("❌ Gemini API error:", msg);
    throw new Error(`Gemini API error: ${msg}`);
  }

  const data = await response.json();

  const finishReason = data?.candidates?.[0]?.finishReason;
  if (finishReason === "SAFETY") {
    throw new Error(
      "Gemini blocked this request for safety reasons. Try rephrasing your topic or instructions.",
    );
  }

  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!rawText) {
    throw new Error("Gemini returned an empty response. Please try again.");
  }

  // Clean up markdown formatting
  let cleanedText = rawText;
  cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, "");
  cleanedText = cleanedText.replace(/\s*```$/i, "");

  // Try to extract JSON if there's extra text
  const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    cleanedText = jsonMatch[0];
  }

  return cleanedText.trim();
}

// ─── Question Generator ───────────────────────────────────────────────────────

async function generateQuestionsWithGemini({
  content,
  topic,
  numQuestions,
  gradeLevel,
  difficulty,
  questionTypes,
  customInstructions,
}) {
  const MAX_CONTENT_CHARS = 12000;
  const trimmedContent = content
    ? content.replace(/\s+/g, " ").trim().slice(0, MAX_CONTENT_CHARS)
    : null;

  const sourceDescription = trimmedContent
    ? `The following is the source material extracted from the uploaded document:\n\n"""\n${trimmedContent}\n"""`
    : `Generate questions about the topic: "${topic}"`;

  const typeInstructions = [];
  if (questionTypes.includes("multiple-choice"))
    typeInstructions.push("multiple-choice questions (4 options, one correct)");
  if (questionTypes.includes("true-false"))
    typeInstructions.push("true/false questions");
  const typeLine =
    typeInstructions.length > 0
      ? `Question types to include: ${typeInstructions.join(" and ")}.`
      : "Use a mix of multiple-choice and true/false questions.";

  const customLine = customInstructions
    ? `Additional instructions from the teacher: ${customInstructions}`
    : "";

  const prompt = `You are an expert educational assessment creator for Grade ${gradeLevel} students.
Your task is to generate exactly ${numQuestions} exam questions at ${difficulty} difficulty.

QUESTION VARIETY REQUIREMENTS:
- Create a mix of easy, medium, and hard questions
- Include questions that test understanding, not just memorization
- Add scenario-based questions where applicable
- Use real-world examples to make questions engaging

${typeLine}
${customLine}

${sourceDescription}

STRICT OUTPUT RULES:
- Respond ONLY with a valid JSON array. No markdown, no backticks, no explanation.
- Each element must be an object with EXACTLY these keys:
  {
    "text": "Full question text (do NOT number it)",
    "type": "multiple-choice" or "true-false",
    "options": ["option A text", "option B text", "option C text", "option D text"],
    "correctAnswer": "exact text of the correct option",
    "points": 1,
    "explanation": "brief explanation of why the answer is correct"
  }
- CRITICAL: When mentioning HTML tags, write them as plain text like 'html' or 'div', not as actual HTML or with angle brackets that might be stripped.
- For true-false: options must be exactly ["True", "False"] and correctAnswer must be "True" or "False".
- For multiple-choice: options must be an array of exactly 4 non-empty strings.
- correctAnswer must be the EXACT full text of one of the options (NOT a letter like "A").
- Do NOT reference "the document", "the text", or "the passage" — ask naturally as if from knowledge.
- Questions must be clearly worded, educationally valid, and appropriate for Grade ${gradeLevel}.
- Ensure questions are diverse and cover different aspects of the material.
- Double-check that all code references, tag names, and technical terms are complete and clearly visible.

Generate ${numQuestions} questions now. Output ONLY the JSON array.`;

  console.log(
    `🤖 Calling Gemini for ${numQuestions} questions (${difficulty}, Grade ${gradeLevel})…`,
  );

  const jsonText = await callGemini(prompt, 4096);

  let questions;
  try {
    questions = JSON.parse(jsonText);
  } catch {
    console.error("❌ Failed to parse Gemini response as JSON:\n", jsonText);
    throw new Error("Gemini returned malformed JSON. Please try again.");
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error(
      "Gemini returned an unexpected structure. Please try again.",
    );
  }

  const sanitised = questions.slice(0, numQuestions).map((q, i) => ({
    id: Date.now() + i,
    text: `${i + 1}. ${String(q.text || "").trim()}`,
    type: q.type === "true-false" ? "true-false" : "multiple-choice",
    options: Array.isArray(q.options) ? q.options : ["True", "False"],
    correctAnswer: String(q.correctAnswer || "").trim(),
    points: Number(q.points) || 1,
    explanation: String(q.explanation || "").trim(),
    topic: topic || "Document",
  }));

  console.log(`✅ Generated ${sanitised.length} questions via Gemini`);
  return sanitised;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

router.post("/generate-from-file", upload.single("file"), async (req, res) => {
  const fileInfo = await getFileInfo(req.file.path, req.file.originalname);
  console.log(`📊 File type: ${fileInfo.type}, Size: ${fileInfo.size} bytes`);
  console.log("📁 [AI] generate-from-file called");

  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "No file uploaded. Please select a file." });
    }

    console.log(
      `✅ File received: ${req.file.originalname} (${req.file.size} bytes)`,
    );

    let numQuestions = Math.min(parseInt(req.body.numQuestions) || 5, 50);
    let gradeLevel = Math.min(
      Math.max(parseInt(req.body.gradeLevel) || 11, 1),
      12,
    );
    const difficulty = req.body.difficulty || "medium";
    const customInstructions = req.body.customInstructions || "";

    let questionTypes = ["multiple-choice"];
    try {
      questionTypes = JSON.parse(
        req.body.questionTypes || '["multiple-choice"]',
      );
    } catch {
      /* keep default */
    }

    let fileContent = "";
    try {
      fileContent = await extractTextFromFile(
        req.file.path,
        req.file.originalname,
      );
    } catch (extractError) {
      return res.status(400).json({ error: extractError.message });
    } finally {
      try {
        fs.unlinkSync(req.file.path);
      } catch {
        /* ignore */
      }
    }

    if (!fileContent || fileContent.trim().length < 50) {
      return res.status(400).json({
        error:
          "Could not extract sufficient text from the file. It may be empty, corrupted, or image-only.",
      });
    }

    console.log(`📝 Extracted ${fileContent.length} chars from file`);

    const questions = await generateQuestionsWithGemini({
      content: fileContent,
      topic: null,
      numQuestions,
      gradeLevel,
      difficulty,
      questionTypes,
      customInstructions,
    });

    res.json({
      questions,
      sessionId: Date.now(),
      message: `Successfully generated ${questions.length} questions from your file.`,
      fileInfo: {
        name: req.file.originalname,
        size: req.file.size,
        contentLength: fileContent.length,
      },
    });
  } catch (error) {
    console.error("❌ generate-from-file error:", error.message);
    res
      .status(500)
      .json({ error: error.message || "Failed to generate questions." });
  }
});

router.post("/generate-exam", async (req, res) => {
  try {
    const {
      topic,
      numQuestions = 5,
      gradeLevel = 11,
      difficulty = "medium",
      questionTypes = ["multiple-choice"],
      customInstructions = "",
    } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: "Topic is required." });
    }

    const questions = await generateQuestionsWithGemini({
      content: null,
      topic: topic.trim(),
      numQuestions: Math.min(parseInt(numQuestions) || 5, 50),
      gradeLevel: Math.min(Math.max(parseInt(gradeLevel) || 11, 1), 12),
      difficulty,
      questionTypes,
      customInstructions,
    });

    res.json({ questions, sessionId: Date.now() });
  } catch (error) {
    console.error("❌ generate-exam error:", error.message);
    res
      .status(500)
      .json({ error: error.message || "Failed to generate questions." });
  }
});

router.post("/generate-replacement", async (req, res) => {
  const {
    originalQuestion,
    sourceContent,
    customInstructions,
    gradeLevel = 11,
    difficulty = "medium",
  } = req.body;

  console.log("🔄 Generating replacement question via Gemini");

  try {
    const contextDescription = sourceContent
      ? `Based on this source material:\n"""\n${sourceContent.slice(0, 4000)}\n"""`
      : `Based on the topic of the original question: "${
          originalQuestion?.text || "general knowledge"
        }"`;

    const originalText = originalQuestion?.text
      ? `The question to replace is: "${originalQuestion.text}". Generate a DIFFERENT question on the same subject.`
      : "Generate one new question.";

    const prompt = `${contextDescription}

${originalText}

Generate exactly 1 replacement exam question for Grade ${gradeLevel} at ${difficulty} difficulty.
${customInstructions ? `Additional instructions: ${customInstructions}` : ""}

Respond ONLY with a JSON object (not an array):
{
  "text": "Question text (no number prefix)",
  "type": "multiple-choice",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "exact text of correct option",
  "points": 1,
  "explanation": "brief explanation"
}

Output ONLY the JSON object, nothing else.`;

    const jsonText = await callGemini(prompt, 800);

    let q;
    try {
      q = JSON.parse(jsonText);
      if (Array.isArray(q)) q = q[0];
    } catch {
      throw new Error(
        "Gemini returned malformed JSON for replacement question.",
      );
    }

    const question = {
      id: Date.now(),
      text: `1. ${String(q.text || "").trim()}`,
      type: q.type === "true-false" ? "true-false" : "multiple-choice",
      options: Array.isArray(q.options) ? q.options : ["True", "False"],
      correctAnswer: String(q.correctAnswer || "").trim(),
      points: Number(q.points) || 1,
      explanation: String(q.explanation || "").trim(),
    };

    res.json({ question });
  } catch (error) {
    console.error("❌ generate-replacement error:", error.message);
    res.status(500).json({
      error: error.message || "Failed to generate replacement question.",
    });
  }
});

// ─── Rejected Questions Bank ──────────────────────────────────────────────────

let rejectedQuestionsStore = [];

router.post("/save-rejected", async (req, res) => {
  const { question, reason, sourceContent, topic, gradeLevel } = req.body;

  const rejectedQuestion = {
    id: Date.now(),
    question: question?.text || question,
    type: question?.type || "multiple-choice",
    options: question?.options || [],
    correctAnswer: question?.correctAnswer || "",
    reason: reason || "Not specified",
    sourceContext: sourceContent?.substring(0, 500),
    topic: topic || "General",
    gradeLevel: gradeLevel || 11,
    rejectedAt: new Date().toISOString(),
  };

  rejectedQuestionsStore.push(rejectedQuestion);
  console.log(
    `📋 Rejected question saved. Total: ${rejectedQuestionsStore.length}`,
  );

  res.json({
    message: "Question saved to rejected bank",
    rejectedCount: rejectedQuestionsStore.length,
    rejectedQuestion,
  });
});

router.get("/rejected-questions", async (req, res) => {
  res.json(rejectedQuestionsStore);
});

router.delete("/rejected-questions/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  rejectedQuestionsStore = rejectedQuestionsStore.filter((q) => q.id !== id);
  res.json({ message: "Question removed from rejected bank" });
});

export default router;
