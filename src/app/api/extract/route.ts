import { extractInvoice } from "@/actions/extract";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileId } = body;

    if (!fileId) {
      return Response.json({ success: false, error: "fileId is required", code: "BAD_REQUEST" }, { status: 400 });
    }

    const result = await extractInvoice(fileId);
    return Response.json(result);
  } catch (error) {
    console.error("Extract route error:", error);
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Extraction failed", code: "ROUTE_ERROR" },
      { status: 500 }
    );
  }
}
