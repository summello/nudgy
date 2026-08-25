"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateOperationId, formatFileSize } from "@/lib/utils";

const ALLOWED_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadInvoice(formData: FormData) {
  const operationId = generateOperationId();
  const file = formData.get("file") as File;

  if (!file) {
    return { success: false, error: "No file provided", code: "NO_FILE" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: `File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`, code: "FILE_TOO_LARGE" };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { success: false, error: "Only PDF, PNG, and JPG files are allowed", code: "INVALID_TYPE" };
  }

  // Verify file signature (magic bytes)
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const isValidType = verifyFileSignature(buffer, file.type);
  
  if (!isValidType) {
    return { success: false, error: "File type does not match content. Please upload a valid PDF, PNG, or JPG.", code: "SIGNATURE_MISMATCH" };
  }

  const supabase = await createServerSupabaseClient();
  
  // Get user session; guest/sessionId fallback would violate RLS and the UUID column
  const { data: { user } } = await supabase.auth.getUser();
  const ownerId = user?.id;

  if (!ownerId) {
    return { success: false, error: "Authentication required", code: "UNAUTHORIZED" };
  }

  // Calculate SHA-256 hash for deduplication
  const crypto = await import("crypto");
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");

  // Check for existing file with same hash
  const { data: existingFile } = await supabase
    .from("invoice_files")
    .select("id, object_path")
    .eq("owner_id", ownerId)
    .eq("sha256_hash", hash)
    .single();

  if (existingFile) {
    return { 
      success: true, 
      fileId: existingFile.id,
      objectPath: existingFile.object_path,
      duplicate: true,
      operationId 
    };
  }

  // Upload to private storage
  const fileExt = file.name.split(".").pop() || "bin";
  const objectPath = `${ownerId}/${operationId}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("invoice-files")
    .upload(objectPath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return { success: false, error: "Failed to upload file", code: "UPLOAD_FAILED" };
  }

  // Record file metadata
  const { data: fileRecord, error: dbError } = await supabase
    .from("invoice_files")
    .insert({
      id: crypto.randomUUID(),
      owner_id: ownerId,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      object_path: objectPath,
      sha256_hash: hash,
      status: "uploaded",
    })
    .select()
    .single();

  if (dbError) {
    console.error("DB error:", dbError);
    // Try to clean up storage
    await supabase.storage.from("invoice-files").remove([objectPath]);
    return { success: false, error: "Failed to save file metadata", code: "DB_ERROR" };
  }

  return { 
    success: true, 
    fileId: fileRecord.id,
    objectPath: fileRecord.object_path,
    operationId 
  };
}

function verifyFileSignature(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false;

  // PDF: %PDF
  if (mimeType === "application/pdf") {
    return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  }

  // PNG: \x89PNG\r\n\x1a\n
  if (mimeType === "image/png") {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  }

  // JPEG: \xFF\xD8\xFF
  if (mimeType === "image/jpeg") {
    return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  }

  return false;
}

export async function getSignedUrl(objectPath: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Verify ownership
  const { data: fileRecord } = await supabase
    .from("invoice_files")
    .select("id")
    .eq("object_path", objectPath)
    .eq("owner_id", user.id)
    .single();

  if (!fileRecord) {
    return { success: false, error: "File not found" };
  }

  const { data, error } = await supabase.storage
    .from("invoice-files")
    .createSignedUrl(objectPath, 300); // 5 minutes

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, url: data.signedUrl };
}

export async function deleteFile(fileId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Get file record
  const { data: fileRecord, error: fetchError } = await supabase
    .from("invoice_files")
    .select("object_path")
    .eq("id", fileId)
    .eq("owner_id", user.id)
    .single();

  if (fetchError || !fileRecord) {
    return { success: false, error: "File not found" };
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from("invoice-files")
    .remove([fileRecord.object_path]);

  if (storageError) {
    console.error("Storage delete error:", storageError);
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from("invoice_files")
    .delete()
    .eq("id", fileId)
    .eq("owner_id", user.id);

  if (dbError) {
    return { success: false, error: "Failed to delete file record" };
  }

  return { success: true };
}