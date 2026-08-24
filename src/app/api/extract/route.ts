import { extractInvoice } from "@/actions/extract";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { fileId } = body;
  
  if (!fileId) {
    return Response.json({ success: false, error: "fileId is required" }, { status: 400 });
  }
  
  const result = await extractInvoice(fileId);
  return Response.json(result);
}