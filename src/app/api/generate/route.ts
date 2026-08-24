import { generateReminder } from "@/actions/generate";
import { NextRequest } from "next/server";
import { generationInputSchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Validate input
  const validation = generationInputSchema.safeParse(body);
  if (!validation.success) {
    return Response.json({ success: false, error: "Invalid input", details: validation.error.flatten() }, { status: 400 });
  }
  
  const result = await generateReminder(validation.data);
  return Response.json(result);
}