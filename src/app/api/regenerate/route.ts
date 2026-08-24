import { regenerateReminder } from "@/actions/generate";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reminderId, tone, context, paymentMethod } = body;

    if (!reminderId || !tone) {
      return Response.json(
        { success: false, error: "reminderId and tone are required", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    const result = await regenerateReminder(reminderId, tone, context, paymentMethod);
    return Response.json(result);
  } catch (error) {
    console.error("Regenerate route error:", error);
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Regeneration failed", code: "ROUTE_ERROR" },
      { status: 500 }
    );
  }
}
