import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sensitiveConfirmationSchema } from "@/lib/account-security";
import { readJsonBody, RequestBodyError } from "@/lib/request-security";
import { RATE_LIMITS, rateLimitClient, rateLimitRequest } from "@/lib/api-protection";
import { ipIdentity } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.email) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    const limited = await rateLimitRequest(rateLimitClient(supabase), request, [
      { identity: ipIdentity(request), rule: RATE_LIMITS.accountSensitive },
      { identity: `user:${user.id}`, rule: RATE_LIMITS.accountSensitive },
    ]);
    if (limited) return limited;

    const parsed = sensitiveConfirmationSchema.safeParse(await readJsonBody(request, 8 * 1024));
    if (!parsed.success) return NextResponse.json({ error: "Bestätigung ungültig" }, { status: 400 });
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: parsed.data.currentPassword,
    });
    if (reauthError) return NextResponse.json({ error: "Aktuelles Passwort ist ungültig" }, { status: 403 });

    for (const table of ["exercise_results", "lesson_attempts", "vocabulary_review_events", "daily_activity", "offline_events", "user_progress"]) {
      const { error } = await supabase.from(table).delete().eq("user_id", user.id);
      if (error) return NextResponse.json({ error: "Lerndaten konnten nicht vollständig gelöscht werden" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json({ error: "Ungültige Anfrage", code: error.code }, { status: error.code === "BODY_TOO_LARGE" ? 413 : 400 });
    }
    return NextResponse.json({ error: "Lerndaten konnten nicht gelöscht werden" }, { status: 500 });
  }
}
