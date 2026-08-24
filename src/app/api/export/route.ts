import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { reminderId, action } = body;
  
  if (!reminderId || !action) {
    return Response.json({ success: false, error: "reminderId and action are required" }, { status: 400 });
  }
  
  const validActions = ["email_copied", "whatsapp_copied", "whatsapp_opened"];
  if (!validActions.includes(action)) {
    return Response.json({ success: false, error: "Invalid action" }, { status: 400 });
  }
  
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  
  // Verify reminder ownership
  const { data: reminder, error: reminderError } = await supabase
    .from("reminders")
    .select("id")
    .eq("id", reminderId)
    .eq("owner_id", user.id)
    .single();
  
  if (reminderError || !reminder) {
    return Response.json({ success: false, error: "Reminder not found" }, { status: 404 });
  }
  
  // Record export event
  const { error } = await supabase
    .from("reminder_exports")
    .insert({
      reminder_id: reminderId,
      owner_id: user.id,
      action: action as "email_copied" | "whatsapp_copied" | "whatsapp_opened",
    });
  
  if (error) {
    console.error("Export record error:", error);
    return Response.json({ success: false, error: "Failed to record export" }, { status: 500 });
  }
  
  return Response.json({ success: true });
}