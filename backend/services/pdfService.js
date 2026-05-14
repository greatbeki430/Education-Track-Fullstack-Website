import fs from "fs";
import PDFParser from "pdf2json";

/**
 * Safely decode URI component with fallback
 * @param {string} text - Text to decode
 * @returns {string} - Decoded text or original if decoding fails
 */
function safeDecodeURI(text) {
  if (!text) return "";
  try {
    return decodeURIComponent(text);
  } catch (e) {
    // If decoding fails, return the original text
    console.warn("⚠️ URI decoding failed for text:", text.substring(0, 50));
    return text;
  }
}

/**
 * Extract text from a PDF file using pdf2json
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractPDFText(filePath) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(this, 1);

    pdfParser.on("pdfParser_dataError", (errData) => {
      console.error("PDF parsing error:", errData);
      reject(new Error(`Failed to extract PDF text: ${errData.parserError}`));
    });

    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      try {
        let text = "";

        // Extract text from all pages
        if (pdfData && pdfData.Pages) {
          for (const page of pdfData.Pages) {
            if (page.Texts) {
              for (const textNode of page.Texts) {
                if (textNode.R && textNode.R[0] && textNode.R[0].T) {
                  // Safely decode the text
                  const decodedText = safeDecodeURI(textNode.R[0].T);
                  text += decodedText + " ";
                }
              }
              text += "\n"; // Add newline after each page
            }
          }
        }

        // Clean up extra spaces and trim, but preserve line breaks
        text = text
          .replace(/[ \t]+/g, " ")
          .replace(/ +\n/g, "\n")
          .trim();

        const pageCount = pdfData.Pages ? pdfData.Pages.length : 0;
        console.log(
          `✅ PDF extracted: ${pageCount} pages, ${text.length} characters`,
        );
        resolve(text);
      } catch (error) {
        console.error("Error processing PDF data:", error);
        reject(new Error(`Failed to process PDF: ${error.message}`));
      }
    });

    // Load and parse the PDF
    pdfParser.loadPDF(filePath);
  });
}

/**
 * Extract text with page limit
 * @param {string} filePath - Path to the PDF file
 * @param {number|null} maxPages - Maximum pages to extract
 * @returns {Promise<string>} - Extracted text
 */
export async function extractPDFTextStreaming(filePath, maxPages = null) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(this, 1);
    let allText = "";

    pdfParser.on("pdfParser_dataError", (errData) => {
      console.error("PDF streaming error:", errData);
      reject(new Error(`Failed to extract PDF text: ${errData.parserError}`));
    });

    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      try {
        if (pdfData && pdfData.Pages) {
          // Limit pages if maxPages is specified
          const pagesToProcess = maxPages
            ? pdfData.Pages.slice(0, maxPages)
            : pdfData.Pages;

          for (const page of pagesToProcess) {
            if (page.Texts) {
              for (const textNode of page.Texts) {
                if (textNode.R && textNode.R[0] && textNode.R[0].T) {
                  const decodedText = safeDecodeURI(textNode.R[0].T);
                  allText += decodedText + " ";
                }
              }
              allText += "\n";
            }
          }
        }

        allText = allText
          .replace(/[ \t]+/g, " ")
          .replace(/ +\n/g, "\n")
          .trim();
        console.log(
          `✅ PDF streamed: ${pagesToProcess?.length || 0} pages, ${allText.length} characters`,
        );
        resolve(allText);
      } catch (error) {
        console.error("Error processing PDF stream:", error);
        reject(new Error(`Failed to process PDF: ${error.message}`));
      }
    });

    pdfParser.loadPDF(filePath);
  });
}

/**
 * Get PDF metadata
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<object>} - Metadata object
 */
export async function getPDFMetadata(filePath) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(this, 1);

    pdfParser.on("pdfParser_dataError", (errData) => {
      reject(new Error(`Failed to get PDF metadata: ${errData.parserError}`));
    });

    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      try {
        let textPreview = "";

        // Get first 500 characters as preview
        if (
          pdfData &&
          pdfData.Pages &&
          pdfData.Pages[0] &&
          pdfData.Pages[0].Texts
        ) {
          let previewText = "";
          let charCount = 0;

          for (const textNode of pdfData.Pages[0].Texts) {
            if (charCount >= 500) break;
            if (textNode.R && textNode.R[0] && textNode.R[0].T) {
              const decodedText = safeDecodeURI(textNode.R[0].T);
              previewText += decodedText + " ";
              charCount += decodedText.length;
            }
          }
          textPreview = previewText
            .replace(/[ \t]+/g, " ")
            .trim()
            .substring(0, 500);
        }

        resolve({
          pageCount: pdfData.Pages ? pdfData.Pages.length : 0,
          info: {
            Title: pdfData.Transcoder?.Title || "",
            Author: pdfData.Transcoder?.Author || "",
            Creator: pdfData.Transcoder?.Creator || "",
            Producer: pdfData.Transcoder?.Producer || "",
          },
          textPreview: textPreview,
          version: pdfData.Transcoder?.PDFFormatVersion || "",
        });
      } catch (error) {
        console.error("Error extracting metadata:", error);
        reject(new Error(`Failed to extract metadata: ${error.message}`));
      }
    });

    pdfParser.loadPDF(filePath);
  });
}

/**
 * Validate if file is a valid PDF
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<boolean>} - True if valid PDF
 */
export async function isValidPDF(filePath) {
  try {
    const metadata = await getPDFMetadata(filePath);
    return metadata.pageCount > 0;
  } catch (error) {
    console.error("PDF validation failed:", error.message);
    return false;
  }
}
