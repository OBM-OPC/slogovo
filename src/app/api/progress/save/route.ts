import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import { mergeProgress } from "@/lib/progress-merge";
import { progressToRow, rowToProgress } from "@/lib/progress-serialization";
import { parseUserProgress } from "@/lib/progress-schema";
import { logEvent } from "@/lib/structured-log";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const body = (await request.json()) as { progress?: unknown };
    const progress = parseUserProgress(body.progress);

    if (!progress || progress.userId !== user.id) {
      return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
    }

    const { data: existing, error: loadError } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (loadError) {
      logEvent("database_error", { errorCode: "DATABASE_READ_FAILED", operation: "progress_merge" });
      return NextResponse.json(
        { error: "Fehler beim Zusammenführen", details: loadError.message },
        { status: 500 }
      );
    }

    const remote = rowToProgress(existing as Record<string, unknown> | null, user.id);
    const merged = remote ? mergeProgress(progress, remote) : progress;
    const { error } = await supabase
      .from("user_progress")
      .upsert(
        {
          ...progressToRow(merged),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      logEvent("database_error", { errorCode: "DATABASE_WRITE_FAILED", operation: "progress_save" });
      return NextResponse.json(
        { error: "Fehler beim Speichern", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, progress: merged }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Ungültige Fortschrittsdaten", issues: error.issues },
        { status: 400 }
      );
    }
    logEvent("database_error", { errorCode: "DATABASE_WRITE_FAILED", operation: "progress_save" });
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten", details: message },
      { status: 500 }
    );
  }
}
