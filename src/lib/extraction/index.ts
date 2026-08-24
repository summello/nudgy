import pdfParse from "pdf-parse";

/**
 * Extracts embedded text from a digitally generated PDF.
 * Image-only (scanned) PDFs are not supported in the MVP — callers should
 * direct users to upload a photo or enter details manually.
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error("PDF text extraction error:", error);
    return "";
  }
}
