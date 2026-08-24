"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateOperationId } from "@/lib/utils";
import { extractTextFromPDF } from "@/lib/extraction";
import { extractInvoiceFromImage, isOpenRouterConfigured } from "@/lib/openrouter/vision";
import { extractedInvoiceSchema, ExtractedInvoice } from "@/lib/schemas";

export async function extractInvoice(fileId: string) {
  const operationId = generateOperationId();
  const supabase = await createServerSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
  }

  // Get file record
  const { data: fileRecord, error: fileError } = await supabase
    .from("invoice_files")
    .select("*")
    .eq("id", fileId)
    .eq("owner_id", user.id)
    .single();

  if (fileError || !fileRecord) {
    return { success: false, error: "File not found", code: "NOT_FOUND" };
  }

  // Update status to processing
  await supabase
    .from("invoice_files")
    .update({ status: "processing", extraction_method: "pending" })
    .eq("id", fileId);

  try {
    // Get signed URL for processing
    const { data: urlData, error: urlError } = await supabase.storage
      .from("invoice-files")
      .createSignedUrl(fileRecord.object_path, 300);

    if (urlError || !urlData) {
      throw new Error("Failed to get file URL");
    }

    let extracted: ExtractedInvoice;
    let extractionMethod = "unknown";
    let extractedText = "";

    if (fileRecord.mime_type.startsWith("image/")) {
      // Vision-model extraction for photos (replaces the old OCR placeholder).
      if (!isOpenRouterConfigured()) {
        throw new Error(
          "Image invoices need OPENROUTER_API_KEY configured (vision model). Enter the details manually instead."
        );
      }
      const response = await fetch(urlData.signedUrl);
      const arrayBuffer = await response.arrayBuffer();
      const mime = fileRecord.mime_type || "image/jpeg";
      const dataUrl = `data:${mime};base64,${Buffer.from(arrayBuffer).toString("base64")}`;

      extracted = await extractInvoiceFromImage(dataUrl);
      extractionMethod = "vision";
    } else {
      // PDFs: embedded text first; regex-based field parsing on top.
      const response = await fetch(urlData.signedUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const pdfText = await extractTextFromPDF(buffer);

      if (pdfText && pdfText.trim().length > 50) {
        extractedText = pdfText;
        extractionMethod = "pdf_text";
        extracted = await extractInvoiceFields(pdfText, fileRecord.mime_type);
      } else {
        // Scanned/image-only PDFs need page rendering — out of MVP scope.
        throw new Error(
          "This PDF has no selectable text (it may be a scan). Export it as an image or enter the details manually."
        );
      }
    }

    // Update file record with extraction results
    await supabase
      .from("invoice_files")
      .update({
        status: "extracted",
        extraction_method: extractionMethod,
        extracted_text: extractedText,
        extracted_data: extracted,
      })
      .eq("id", fileId);

    return { success: true, extracted, operationId };
  } catch (error) {
    console.error("Extraction error:", error);
    
    await supabase
      .from("invoice_files")
      .update({ status: "failed", extraction_method: "failed" })
      .eq("id", fileId);

    return { success: false, error: "Failed to extract invoice data", code: "EXTRACTION_FAILED" };
  }
}

async function extractInvoiceFields(text: string, mimeType: string): Promise<ExtractedInvoice> {
  // In a real implementation, this would call an LLM with a structured prompt
  // For MVP, we'll return a mock based on the text content
  
  // This is a simplified extraction - real implementation would use LLM
  const result: ExtractedInvoice = {
    clientName: { value: "", confidence: "missing" },
    contactName: { value: null, confidence: "missing" },
    contactPhoneE164: { value: null, confidence: "missing" },
    invoiceNumber: { value: null, confidence: "missing" },
    amountDueMinor: { value: 0, confidence: "missing" },
    currency: { value: "INR", confidence: "high" },
    issueDate: { value: null, confidence: "missing" },
    dueDate: { value: null, confidence: "missing" },
  };

  // Simple regex-based extraction for demo
  // Real implementation would use LLM with structured output
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  
  // Look for amount patterns (₹ or INR)
  const amountMatches = text.match(/₹\s*([\d,]+(?:\.\d{2})?)|INR\s*([\d,]+(?:\.\d{2})?)/gi);
  if (amountMatches) {
    const amountStr = amountMatches[0].replace(/[₹,\sINR]/gi, "");
    const amount = parseFloat(amountStr) * 100;
    if (!isNaN(amount)) {
      result.amountDueMinor = { value: Math.round(amount), confidence: "review", evidence: amountMatches[0] };
    }
  }

  // Look for dates
  const dateMatches = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4}/gi);
  if (dateMatches && dateMatches.length >= 2) {
    // Assume first date is issue, second is due
    result.issueDate = { value: dateMatches[0], confidence: "review", evidence: dateMatches[0] };
    result.dueDate = { value: dateMatches[1], confidence: "review", evidence: dateMatches[1] };
  } else if (dateMatches && dateMatches.length === 1) {
    result.dueDate = { value: dateMatches[0], confidence: "review", evidence: dateMatches[0] };
  }

  // Look for invoice number
  const invMatches = text.match(/(?:invoice|inv)[\s#:]*([A-Z0-9\-]+)/gi);
  if (invMatches) {
    result.invoiceNumber = { value: invMatches[0].replace(/(?:invoice|inv)[\s#:]*/gi, ""), confidence: "review", evidence: invMatches[0] };
  }

  // Look for client name (usually near the top)
  if (lines.length > 0) {
    // Heuristic: first non-header line might be client name
    for (const line of lines.slice(0, 5)) {
      if (line.length > 3 && line.length < 100 && !line.match(/^(invoice|bill|tax|gst|date|amount|total)/i)) {
        result.clientName = { value: line, confidence: "review", evidence: line };
        break;
      }
    }
  }

  return result;
}