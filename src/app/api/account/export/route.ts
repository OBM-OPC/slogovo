import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const EXPORT_TABLES = [
  "user_progress",
  "lesson_attempts",
  "exercise_results",
  "vocabulary_review_events",
  "daily_activity",
] as const;

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const records: Record<string, unknown> = {};
  for (const table of EXPORT_TABLES) {
    const { data, error } = await supabase.from(table).select("*").eq("user_id", user.id);
    if (error) {
      return NextResponse.json({ error: "Datenexport fehlgeschlagen" }, { status: 500 });
    }
    records[table] = data ?? [];
  }

  const payload = JSON.stringify({
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email ?? null,
      createdAt: user.created_at,
      metadata: {
        name: user.user_metadata?.name ?? null,
        displayName: user.user_metadata?.display_name ?? null,
        bio: user.user_metadata?.bio ?? null,
      },
    },
    learningData: records,
  }, null, 2);

  return new NextResponse(payload, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="slogovo-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
