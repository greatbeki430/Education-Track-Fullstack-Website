import fs from "fs";
import pdf from "pdf-parse";

// This wrapper function ensures pdf-parse works correctly with ES modules
export async function parsePDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
}
