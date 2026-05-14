import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import { extractPDFText, extractPDFTextStreaming } from "./pdfService.js";

/**
 * Extract text from various file types
 * @param {string} filePath - Path to the file
 * @param {string} originalName - Original filename with extension
 * @param {object} options - Extraction options
 * @returns {Promise<string>} - Extracted text
 */
export async function extractTextFromFile(
  filePath,
  originalName,
  options = {},
) {
  const ext = path.extname(originalName).toLowerCase();
  console.log(`📄 Extracting from: ${originalName} (${ext})`);

  const startTime = Date.now();

  try {
    let text = "";

    switch (ext) {
      case ".pdf":
        if (options.streaming && options.maxPages) {
          text = await extractPDFTextStreaming(filePath, options.maxPages);
        } else {
          text = await extractPDFText(filePath);
        }
        break;

      case ".docx":
        const docxBuffer = fs.readFileSync(filePath);
        const docxResult = await mammoth.extractRawText({ buffer: docxBuffer });
        text = docxResult.value;
        console.log(`✅ DOCX parsed: ${text.length} chars`);
        break;

      case ".txt":
        text = fs.readFileSync(filePath, "utf8");
        console.log(`✅ TXT read: ${text.length} chars`);
        break;

      default:
        throw new Error(
          `Unsupported file type: ${ext}. Please upload PDF, DOCX, or TXT files.`,
        );
    }

    const duration = Date.now() - startTime;
    console.log(`⏱️ Extraction completed in ${duration}ms`);

    return text;
  } catch (error) {
    console.error("❌ Extraction error:", error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
}

/**
 * Get file information without full extraction
 * @param {string} filePath - Path to the file
 * @param {string} originalName - Original filename
 * @returns {Promise<object>} - File information
 */
export async function getFileInfo(filePath, originalName) {
  const stats = fs.statSync(filePath);
  const ext = path.extname(originalName).toLowerCase();

  return {
    name: originalName,
    size: stats.size,
    extension: ext,
    createdAt: stats.birthtime,
    modifiedAt: stats.mtime,
    type: ext.substring(1), // Remove the dot
  };
}
