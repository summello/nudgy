import { uploadInvoice } from "@/actions/upload";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const result = await uploadInvoice(formData);
  return Response.json(result);
}