import { generateReminder } from "@/actions/generate";
import { generationInputSchema } from "@/lib/schemas";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = generationInputSchema.safeParse(body);
    if (!validation.success) {
      return Response.json(
        { success: false, error: "Invalid input", details: validation.error.flatten(), code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    const result = await generateReminder(validation.data);
    return Response.json(result);
  } catch (error) {
    console.error("Generate route error:", error);
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Generation failed", code: "ROUTE_ERROR" },
      { status: 500 }
    );
  }
}
