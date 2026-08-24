import { regenerateReminder } from "@/actions/generate";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { reminderId, tone, context, paymentMethod } = body;
  
  if (!reminderId || !tone) {
    return Response.json({ success: false, error: "reminderId and tone are required" }, { status: 400 });
  }
  
  const result = await regenerateReminder(reminderId, tone, context, paymentMethod);
  return Response.json(result);
}