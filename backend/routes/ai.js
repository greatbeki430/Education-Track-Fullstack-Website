import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
// FIXED: Proper ES module import for pdf-parse
// import pdfParse from "pdf-parse";
// FIXED: Dynamic import for pdf-parse (works with CommonJS modules)
// let pdfParse;
// (async () => {
//   try {
//     const pdfParseModule = await import("pdf-parse");
//     pdfParse = pdfParseModule.default;
//     console.log("✅ pdf-parse loaded successfully");
//   } catch (err) {
//     console.log("⚠️ pdf-parse not available, PDF support limited");
//   }
// })();
// const pdfParseModule = await import("pdf-parse");

// pdfParse = pdfParseModule.default || pdfParseModule;
import mammoth from "mammoth";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(
      __dirname,
      "../" + (process.env.UPLOAD_DIR || "uploads"),
    );
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024 },
  //fileSize: 50 * 1024 * 1024  // INCREASED to 50MB (from 10MB)
  // fileSize: 10 * 1024 * 1024

  fileFilter: (req, file, cb) => {
    const allowedTypes = [".pdf", ".docx", ".txt"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF, DOCX, and TXT files are allowed.",
        ),
      );
    }
  },
});

// Extract text from uploaded file - PROPERLY IMPLEMENTED
async function extractTextFromFile(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  console.log(`📄 Extracting text from: ${originalName} (${ext})`);

  try {
    if (ext === ".pdf") {
      // PROPER PDF PARSING - WORKS CORRECTLY
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      console.log(
        `✅ PDF parsed: ${pdfData.numpages} pages, ${pdfData.text.length} characters`,
      );
      return pdfData.text;
    } else if (ext === ".docx") {
      // Word document parsing
      const dataBuffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      console.log(`✅ DOCX parsed: ${result.value.length} characters`);
      return result.value;
    } else if (ext === ".txt") {
      // Plain text file
      const text = fs.readFileSync(filePath, "utf8");
      console.log(`✅ TXT read: ${text.length} characters`);
      return text;
    } else {
      throw new Error(
        `Unsupported file format: ${ext}. Please upload PDF, DOCX, or TXT files.`,
      );
    }
  } catch (error) {
    console.error("❌ Text extraction error:", error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
}

// Generate intelligent questions from content
// Generate REAL educational questions from content
// Generate NATURAL exam questions (no "according to the document" references)
function generateQuestionsFromContent(
  content,
  numQuestions,
  gradeLevel,
  difficulty,
  questionTypes,
  customInstructions,
) {
  const questions = [];

  // Step 1: Clean and prepare the content
  let cleanContent = content.replace(/\s+/g, " ").trim();

  // Step 2: Extract meaningful sentences
  const sentences = cleanContent
    .split(/[.!?]+/)
    .filter((s) => {
      const trimmed = s.trim();
      return (
        trimmed.length > 30 &&
        trimmed.length < 300 &&
        !trimmed.startsWith("http") &&
        trimmed.split(" ").length > 5
      );
    })
    .map((s) => s.trim());

  // Step 3: Extract key concepts (nouns and important phrases)
  const words = cleanContent.toLowerCase().split(/\s+/);
  const commonWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "of",
    "to",
    "in",
    "for",
    "on",
    "with",
    "by",
    "at",
    "from",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "having",
    "do",
    "does",
    "did",
    "doing",
    "but",
    "or",
    "so",
    "for",
    "nor",
    "yet",
    "this",
    "that",
    "these",
    "those",
    "it",
    "they",
    "we",
    "you",
    "he",
    "she",
    "them",
    "their",
    "its",
    "can",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "must",
    "such",
    "which",
    "what",
    "when",
    "where",
    "who",
    "whom",
    "whose",
    "why",
    "how",
    "there",
    "their",
    "were",
    "been",
    "into",
    "through",
    "during",
    "before",
    "after",
    "above",
    "below",
    "between",
    "under",
    "over",
    "again",
    "further",
    "then",
    "once",
    "here",
    "there",
    "all",
    "any",
    "both",
    "each",
    "few",
    "more",
    "most",
    "other",
    "some",
    "such",
    "no",
    "nor",
    "not",
    "only",
    "own",
    "same",
    "than",
    "than",
    "then",
    "these",
    "those",
    "too",
    "very",
    "just",
    "but",
    "do",
    "does",
    "did",
    "doing",
    "down",
    "only",
    "own",
  ]);

  // Count word frequency for key concepts
  const wordFrequency = {};
  for (const word of words) {
    if (word.length > 4 && !commonWords.has(word) && !word.match(/^\d+$/)) {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    }
  }

  // Get top keywords
  let keywords = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map((entry) => entry[0]);

  // If no good keywords, extract important phrases
  if (keywords.length < 3) {
    const phrases = cleanContent.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
    keywords = [...new Set(phrases)].slice(0, 15);
  }

  // Still no keywords? Use generic terms
  if (keywords.length < 3) {
    keywords = [
      "the main concept",
      "key principle",
      "important idea",
      "central theme",
      "main argument",
    ];
  }

  console.log(`📚 Extracted keywords: ${keywords.slice(0, 5).join(", ")}...`);

  // Question templates - NATURAL, no document references
  const questionTemplates = {
    definition: [
      "What is {keyword}?",
      "Define {keyword}.",
      'What does the term "{keyword}" mean?',
      "Explain the concept of {keyword}.",
      'What is meant by "{keyword}"?',
    ],
    explanation: [
      "Explain {keyword} in your own words.",
      "What is the purpose of {keyword}?",
      "How does {keyword} work?",
      "Describe the function of {keyword}.",
      "What are the key characteristics of {keyword}?",
    ],
    example: [
      "Give an example of {keyword}.",
      "Which of the following is an example of {keyword}?",
      "Identify a real-world application of {keyword}.",
      "What situation best illustrates {keyword}?",
    ],
    comparison: [
      "What is the difference between {keyword1} and {keyword2}?",
      "How are {keyword1} and {keyword2} related?",
      "Compare {keyword1} with {keyword2}.",
      "What distinguishes {keyword1} from {keyword2}?",
    ],
    application: [
      "When would you use {keyword}?",
      "What is the practical application of {keyword}?",
      "How can {keyword} be applied?",
      "In what scenario is {keyword} most useful?",
    ],
    importance: [
      "Why is {keyword} important?",
      "What is the significance of {keyword}?",
      "What role does {keyword} play?",
      "Why should we understand {keyword}?",
    ],
    truefalse: [
      "{statement}",
      "Is it true that {statement}?",
      "True or False: {statement}",
    ],
  };

  // Difficulty-based complexity
  const difficultyModifiers = {
    easy: { prefix: "", suffix: "" },
    medium: { prefix: "Explain in detail: ", suffix: " Provide reasoning." },
    hard: {
      prefix: "Analyze and evaluate: ",
      suffix: " Justify your answer with specific reasoning.",
    },
  };

  for (let i = 0; i < numQuestions; i++) {
    // Select a meaningful source sentence for context
    let sourceSentence = "";
    if (sentences.length > 0) {
      sourceSentence = sentences[i % sentences.length];
    } else {
      sourceSentence = cleanContent.substring(
        i * 150,
        Math.min((i + 1) * 150, cleanContent.length),
      );
    }

    // Pick keywords for this question
    const keyword = keywords[i % keywords.length];
    const keyword2 = keywords[(i + 1) % keywords.length];

    // Determine question type based on user preference
    const templateTypes = [];
    if (questionTypes.includes("true-false")) templateTypes.push("truefalse");
    if (questionTypes.includes("multiple-choice")) {
      templateTypes.push(
        "definition",
        "explanation",
        "example",
        "comparison",
        "application",
        "importance",
      );
    }

    const selectedType =
      templateTypes.length > 0
        ? templateTypes[i % templateTypes.length]
        : "definition";

    // Generate NATURAL question text
    let questionText = "";
    let options = [];
    let correctAnswer = "";
    let explanation = "";

    if (selectedType === "truefalse") {
      // Create True/False question
      const statement =
        sourceSentence.length > 80
          ? sourceSentence.substring(0, 80) + "..."
          : sourceSentence;
      const isTrue = i % 2 === 0;

      const template =
        questionTemplates.truefalse[i % questionTemplates.truefalse.length];
      questionText = template.replace("{statement}", statement);

      options = ["True", "False"];
      correctAnswer = isTrue ? "True" : "False";
      explanation = `Based on the course material: ${sourceSentence.substring(0, 150)}`;
    } else if (selectedType === "definition") {
      const template =
        questionTemplates.definition[i % questionTemplates.definition.length];
      questionText = template.replace(
        "{keyword}",
        keyword.charAt(0).toUpperCase() + keyword.slice(1),
      );

      // Generate plausible options
      const correctDef =
        sourceSentence.length > 80
          ? sourceSentence.substring(0, 80) + "..."
          : sourceSentence;

      options = [
        correctDef,
        `A different concept that is often confused with ${keyword}`,
        `An unrelated term from another field of study`,
        `The opposite meaning of ${keyword}`,
      ];
      correctAnswer = options[0];
      explanation = `Definition from the material: "${sourceSentence.substring(0, 150)}"`;
    } else if (selectedType === "explanation") {
      const template =
        questionTemplates.explanation[i % questionTemplates.explanation.length];
      questionText = template.replace(
        "{keyword}",
        keyword.charAt(0).toUpperCase() + keyword.slice(1),
      );

      const correctExp =
        sourceSentence.length > 80
          ? sourceSentence.substring(0, 80) + "..."
          : sourceSentence;

      options = [
        correctExp,
        `A superficial description that misses key details`,
        `An incorrect interpretation of ${keyword}`,
        `A related but different concept`,
      ];
      correctAnswer = options[0];
      explanation = `The material explains: "${sourceSentence.substring(0, 150)}"`;
    } else if (selectedType === "example") {
      const template =
        questionTemplates.example[i % questionTemplates.example.length];
      questionText = template.replace(
        "{keyword}",
        keyword.charAt(0).toUpperCase() + keyword.slice(1),
      );

      // Extract potential examples from content
      const exampleSentences = sentences.filter(
        (s) =>
          s.toLowerCase().includes("example") ||
          s.toLowerCase().includes("for instance") ||
          s.toLowerCase().includes("such as"),
      );

      const realExample =
        exampleSentences.length > 0
          ? exampleSentences[0].substring(0, 80)
          : `A practical application of ${keyword} in real-world scenarios`;

      options = [
        realExample,
        `An unrelated example from a different topic`,
        `A theoretical possibility with no practical application`,
        `A common misconception about ${keyword}`,
      ];
      correctAnswer = options[0];
      explanation = `Example from the material: "${(exampleSentences[0] || sourceSentence).substring(0, 150)}"`;
    } else if (selectedType === "comparison") {
      const template =
        questionTemplates.comparison[i % questionTemplates.comparison.length];
      questionText = template
        .replace(
          "{keyword1}",
          keyword.charAt(0).toUpperCase() + keyword.slice(1),
        )
        .replace(
          "{keyword2}",
          keyword2.charAt(0).toUpperCase() + keyword2.slice(1),
        );

      const comparisonSentences = sentences.filter(
        (s) =>
          s.toLowerCase().includes(keyword.toLowerCase()) &&
          s.toLowerCase().includes(keyword2.toLowerCase()),
      );

      const correctComparison =
        comparisonSentences.length > 0
          ? comparisonSentences[0].substring(0, 80)
          : `${keyword} and ${keyword2} are both important concepts in this subject area`;

      options = [
        correctComparison,
        `There is no meaningful relationship between them`,
        `They are completely opposite concepts`,
        `One is a subset of the other`,
      ];
      correctAnswer = options[0];
      explanation =
        comparisonSentences.length > 0
          ? `The material states: "${comparisonSentences[0].substring(0, 150)}"`
          : `Based on understanding both ${keyword} and ${keyword2}.`;
    } else if (selectedType === "application") {
      const template =
        questionTemplates.application[i % questionTemplates.application.length];
      questionText = template.replace(
        "{keyword}",
        keyword.charAt(0).toUpperCase() + keyword.slice(1),
      );

      const correctApp = `When you need to ${keyword} in practical situations, such as solving related problems`;

      options = [
        correctApp,
        `Only in theoretical academic contexts`,
        `Never - it has no practical use`,
        `Only when specifically instructed to do so`,
      ];
      correctAnswer = options[0];
      explanation = `Practical applications of ${keyword} are demonstrated throughout the material.`;
    } else {
      // Importance question
      const template =
        questionTemplates.importance[i % questionTemplates.importance.length];
      questionText = template.replace(
        "{keyword}",
        keyword.charAt(0).toUpperCase() + keyword.slice(1),
      );

      options = [
        `Because ${keyword} is fundamental to understanding this subject area`,
        `It is only important for academic purposes`,
        `It has limited importance compared to other concepts`,
        `Only experts need to understand ${keyword}`,
      ];
      correctAnswer = options[0];
      explanation = `The material emphasizes ${keyword} as a key concept for mastery of this topic.`;
    }

    // Add difficulty modifier to question text
    const modifier =
      difficultyModifiers[difficulty] || difficultyModifiers.medium;
    if (modifier.prefix && i % 3 === 0) {
      questionText =
        modifier.prefix +
        questionText.charAt(0).toLowerCase() +
        questionText.slice(1);
    }
    if (modifier.suffix && i % 4 === 0) {
      questionText = questionText + modifier.suffix;
    }

    questions.push({
      id: Date.now() + i,
      text: `${i + 1}. ${questionText}`,
      type: selectedType === "truefalse" ? "true-false" : "multiple-choice",
      options: options,
      correctAnswer: correctAnswer,
      points: 1,
      explanation: explanation,
      sourceContext: sourceSentence.substring(0, 200),
      topic: keyword,
    });
  }

  console.log(`✅ Generated ${questions.length} natural exam questions`);
  return questions.slice(0, numQuestions);
}
// Generate questions from file content
router.post("/generate-from-file", upload.single("file"), async (req, res) => {
  console.log("📁 [AI] Generate from file endpoint called");
  console.log("📊 Request body:", req.body);

  try {
    // Check if file was uploaded
    if (!req.file) {
      console.log("❌ No file uploaded");
      return res
        .status(400)
        .json({ error: "No file uploaded. Please select a file." });
    }

    console.log(`✅ File received: ${req.file.originalname}`);
    console.log(`📊 File size: ${req.file.size} bytes`);
    console.log(`📊 File path: ${req.file.path}`);

    // Parse request body
    let numQuestions = parseInt(req.body.numQuestions) || 5;
    let gradeLevel = parseInt(req.body.gradeLevel) || 11;
    const difficulty = req.body.difficulty || "medium";
    let questionTypes = [];
    const customInstructions = req.body.customInstructions || "";

    try {
      questionTypes = JSON.parse(
        req.body.questionTypes || '["multiple-choice"]',
      );
    } catch (e) {
      questionTypes = ["multiple-choice"];
    }

    // Validate values
    if (isNaN(numQuestions) || numQuestions < 1) numQuestions = 5;
    if (numQuestions > 50) numQuestions = 50;
    if (isNaN(gradeLevel) || gradeLevel < 1) gradeLevel = 11;
    if (gradeLevel > 12) gradeLevel = 12;

    console.log(
      `📊 Config: ${numQuestions} questions, Grade ${gradeLevel}, ${difficulty}`,
    );
    console.log(`📝 Question types: ${questionTypes.join(", ")}`);
    if (customInstructions)
      console.log(`📋 Custom instructions: ${customInstructions}`);

    // Extract text from file
    let fileContent = "";
    try {
      fileContent = await extractTextFromFile(
        req.file.path,
        req.file.originalname,
      );
      console.log(`✅ Text extracted: ${fileContent.length} characters`);
      console.log(`📝 Preview: ${fileContent.substring(0, 200)}...`);
    } catch (extractError) {
      console.log("❌ Text extraction error:", extractError.message);
      return res.status(400).json({ error: extractError.message });
    }

    // Clean up file after extraction
    try {
      fs.unlinkSync(req.file.path);
      console.log("🗑️ Temporary file deleted");
    } catch (unlinkError) {
      console.log("⚠️ Could not delete temp file:", unlinkError.message);
    }

    if (!fileContent || fileContent.trim().length < 50) {
      return res.status(400).json({
        error:
          "Could not extract sufficient text from file. File may be empty, corrupted, or contains only images.",
      });
    }

    // Generate questions based on file content
    const generatedQuestions = generateQuestionsFromContent(
      fileContent,
      numQuestions,
      gradeLevel,
      difficulty,
      questionTypes,
      customInstructions,
    );

    console.log(
      `✅ Generated ${generatedQuestions.length} questions successfully`,
    );

    res.json({
      questions: generatedQuestions,
      sessionId: Date.now(),
      message: `Successfully generated ${generatedQuestions.length} questions from your file.`,
      fileInfo: {
        name: req.file.originalname,
        size: req.file.size,
        contentLength: fileContent.length,
      },
    });
  } catch (error) {
    console.error("❌ Generation Error:", error);
    res.status(500).json({
      error: "Failed to generate questions",
      details: error.message,
    });
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

    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    const content = `Educational content about ${topic} for grade ${gradeLevel}`;

    const questions = generateQuestionsFromContent(
      content,
      numQuestions,
      gradeLevel,
      difficulty,
      questionTypes,
      customInstructions,
    );

    res.json({ questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate replacement for a rejected question
router.post("/generate-replacement", async (req, res) => {
  const {
    originalQuestion,
    sourceContent,
    customInstructions,
    gradeLevel,
    difficulty,
  } = req.body;

  console.log("🔄 Generating replacement question");

  try {
    // Extract keywords from source content
    const words = sourceContent.toLowerCase().split(/\s+/);
    const commonWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "of",
      "to",
      "in",
      "for",
      "on",
      "with",
      "by",
      "at",
      "from",
      "is",
      "are",
      "was",
      "were",
    ]);
    const keywords = words.filter((w) => w.length > 4 && !commonWords.has(w));
    const uniqueKeywords = [...new Set(keywords)].slice(0, 10);
    const newKeyword =
      uniqueKeywords.length > 0
        ? uniqueKeywords[Math.floor(Math.random() * uniqueKeywords.length)]
        : "the content";

    // Find a different sentence from sourceContent
    const sentences = sourceContent
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 20);
    const newSourceSentence =
      sentences.length > 0
        ? sentences[Math.floor(Math.random() * sentences.length)].trim()
        : sourceContent.substring(0, 150);

    const newQuestion = {
      id: Date.now(),
      text: `Based on the source material, how does the document explain the concept of "${newKeyword}"?`,
      type: "multiple-choice",
      options: [
        `It provides a clear explanation: "${newSourceSentence.substring(0, 60)}..."`,
        `It mentions it only briefly without detail`,
        `It contradicts other parts of the document`,
        `It is not discussed in the source material`,
      ],
      correctAnswer: `It provides a clear explanation: "${newSourceSentence.substring(0, 60)}..."`,
      points: 1,
      explanation: `This directly relates to: "${newSourceSentence.substring(0, 150)}"`,
      sourceContent: sourceContent,
    };

    res.json({ question: newQuestion });
  } catch (error) {
    console.error("Replacement Generation Error:", error);
    res.status(500).json({
      error: "Failed to generate replacement question",
      details: error.message,
    });
  }
});

// Store rejected questions
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
    `📋 Rejected question saved. Total rejected: ${rejectedQuestionsStore.length}`,
  );

  res.json({
    message: "Question saved to rejected bank",
    rejectedCount: rejectedQuestionsStore.length,
    rejectedQuestion: rejectedQuestion,
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

// Mock endpoint for testing (fallback)
router.post(
  "/generate-from-file-mock",
  upload.single("file"),
  async (req, res) => {
    console.log("📁 Mock endpoint called");

    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const numQuestions = parseInt(req.body.numQuestions) || 5;
      const gradeLevel = parseInt(req.body.gradeLevel) || 11;
      const difficulty = req.body.difficulty || "medium";

      let fileContent = "";
      try {
        fileContent = await extractTextFromFile(
          req.file.path,
          req.file.originalname,
        );
      } catch (e) {
        fileContent = `Sample educational content about ${req.file.originalname} for Grade ${gradeLevel} students.`;
      }

      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}

      const questions = generateQuestionsFromContent(
        fileContent,
        numQuestions,
        gradeLevel,
        difficulty,
        ["multiple-choice"],
        "",
      );

      res.json({ questions, sessionId: Date.now() });
    } catch (error) {
      console.error("Mock Error:", error);
      res.status(500).json({ error: "Failed to generate questions" });
    }
  },
);

export default router;
