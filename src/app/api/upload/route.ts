import { uploadInvoice } from "@/actions/upload";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await uploadInvoice(formData);
    return Response.json(result);
  } catch (error) {
    console.error("Upload route error:", error);
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Upload failed", code: "ROUTE_ERROR" },
      { status: 500 }
    );
  }
}
