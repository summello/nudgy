import pdfParse from "pdf-parse";
import sharp from "sharp";

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error("PDF text extraction error:", error);
    return "";
  }
}

export async function extractTextFromImage(buffer: Buffer): Promise<string> {
  try {
    // Preprocess image for better OCR
    const processedBuffer = await sharp(buffer)
      .greyscale()
      .normalize()
      .sharpen()
      .toBuffer();

    // In a real implementation, this would call an OCR service
    // For MVP, we return a placeholder
    // Real options: Tesseract.js, AWS Textract, Google Vision, etc.
    return "[OCR not implemented - would use Tesseract.js or cloud OCR service]";
  } catch (error) {
    console.error("Image OCR error:", error);
    return "";
  }
}

export async function renderPDFPageToImage(buffer: Buffer, pageNumber: number = 1): Promise<Buffer> {
  // This would require pdf2pic or similar library
  // For MVP, not implemented
  throw new Error("PDF to image rendering not implemented in MVP");
}