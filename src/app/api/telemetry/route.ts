import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseTelemetryBatch } from "@/lib/telemetry-schema";
import { logError, logEvent } from "@/lib/structured-log";
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
      { identity: `user:${user.id}`, rule: RATE_LIMITS.telemetryUser },
    ]);
    if (limited) return limited;

    const events = parseTelemetryBatch(await readJsonBody(request, 64 * 1024));
    const { error } = await supabase.from("telemetry_events").insert(events.map((event) => ({
      id: event.id,
      occurred_at: event.timestamp,
      category: event.category,
      event_name: event.name,
      properties: event.properties,
    })));
    if (error) {
      logEvent("database_error", { errorCode: "DATABASE_WRITE_FAILED", operation: "telemetry_insert" });
      return NextResponse.json({ error: "Telemetrie konnte nicht gespeichert werden" }, { status: 500 });
    }
    return NextResponse.json({ accepted: events.length });
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json(
        { error: "Ungültige Telemetriedaten", code: error.code },
        { status: error.code === "BODY_TOO_LARGE" ? 413 : 400 }
      );
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Ungültige Telemetriedaten" }, { status: 400 });
    }
    logError("telemetry.request_failed", error);
    return NextResponse.json({ error: "Telemetrie fehlgeschlagen" }, { status: 500 });
  }
}
