import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAllModules } from "@/lib/content";
import { buildDashboardData } from "@/lib/dashboard";
import { defaultProgress, rowToProgress } from "@/lib/progress-serialization";
import { logEvent } from "@/lib/structured-log";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const { data, error } = await supabase.from("user_progress").select("*").eq("user_id", user.id).maybeSingle();
  if (error) {
    logEvent("database_error", { errorCode: "DATABASE_READ_FAILED", operation: "dashboard" });
    return NextResponse.json({ error: "Dein Lernstand konnte nicht geladen werden." }, { status: 500 });
  }
  const progress = rowToProgress(data as Record<string, unknown> | null, user.id) ?? defaultProgress(user.id);
  return NextResponse.json({ dashboard: buildDashboardData(progress, getAllModules()) });
}
