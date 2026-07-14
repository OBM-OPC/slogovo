import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import { defaultProgress, rowToProgress } from "@/lib/progress-serialization";
import { parseUserProgress } from "@/lib/progress-schema";
import { logEvent } from "@/lib/structured-log";
import { readJsonBody, RequestBodyError } from "@/lib/request-security";
import { ipIdentity } from "@/lib/rate-limit";
import { RATE_LIMITS, rateLimitClient, rateLimitRequest } from "@/lib/api-protection";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const limited = await rateLimitRequest(rateLimitClient(supabase), request, [
      { identity: ipIdentity(request), rule: RATE_LIMITS.syncIp },
      { identity: `user:${user.id}`, rule: RATE_LIMITS.progressUser },
    ]);
    if (limited) return limited;

    const body = (await readJsonBody(request, 512 * 1024)) as { progress?: unknown };
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

    // Aggregate learning state is rebuilt from verified lesson/review events by
    // /api/sync. This compatibility endpoint accepts only user-editable settings
    // and never trusts client-supplied scores, streaks, achievements, or XP.
    const remote = rowToProgress(existing as Record<string, unknown> | null, user.id)
      ?? defaultProgress(user.id);
    const authoritative = { ...remote, settings: progress.settings };
    const { error } = await supabase
      .from("user_progress")
      .upsert(
        {
          user_id: user.id,
          settings: progress.settings,
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

    return NextResponse.json({ success: true, progress: authoritative }, { status: 200 });
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json(
        { error: "Ungültige Fortschrittsdaten", code: error.code },
        { status: error.code === "BODY_TOO_LARGE" ? 413 : 400 }
      );
    }
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
