import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Initialize and return Gemini model instance
 * Uses API key from environment variables
 */
export function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in environment variables");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Using gemini-1.5-flash for good speed/quality balance
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

/**
 * Generate questions from text content using Gemini
 */
export async function generateQuestionsFromText(content, options = {}) {
  const {
    numQuestions = 5,
    gradeLevel = 11,
    difficulty = "medium",
    questionTypes = ["multiple-choice"],
    customInstructions = "",
  } = options;

  const prompt = `
You are an expert exam question generator for Grade ${gradeLevel} students.
Generate exactly ${numQuestions} questions from the content below.

Configuration:
- Difficulty: ${difficulty}
- Question types allowed: ${questionTypes.join(", ")}
- Custom instructions: ${customInstructions || "None"}

IMPORTANT RULES:
1. Return ONLY valid JSON (no markdown, no backticks, no extra text)
2. JSON structure must be EXACTLY:
{
  "questions": [
    {
      "text": "Question text here",
      "type": "multiple-choice" or "true-false",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "A",
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}

3. For true-false questions, options must be ["True", "False"]
4. Questions must be clear, educational, and based only on the provided content
5. Avoid phrases like "according to the document" or "based on the text"

CONTENT TO GENERATE QUESTIONS FROM:
${content.slice(0, 15000)} // Limit to 15k chars for performance
`;

  try {
    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Clean response (remove markdown if any)
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText
        .replace(/```json\n?/, "")
        .replace(/```\n?$/, "");
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/```\n?/, "").replace(/```\n?$/, "");
    }

    // Parse JSON
    const parsed = JSON.parse(cleanedText);

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid response structure: missing questions array");
    }

    return parsed.questions;
  } catch (error) {
    console.error("Gemini generation error:", error);
    throw new Error(`Failed to generate questions: ${error.message}`);
  }
}
