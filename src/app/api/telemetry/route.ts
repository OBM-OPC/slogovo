import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseTelemetryBatch } from "@/lib/telemetry-schema";
import { logError, logEvent } from "@/lib/structured-log";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const events = parseTelemetryBatch(await request.json());
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
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Ungültige Telemetriedaten" }, { status: 400 });
    }
    logError("telemetry.request_failed", error);
    return NextResponse.json({ error: "Telemetrie fehlgeschlagen" }, { status: 500 });
  }
}
