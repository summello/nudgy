import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}/invoices`);
      }
      console.error("Auth code exchange failed:", error.message);
    } catch (err) {
      console.error("Auth callback error:", err);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
