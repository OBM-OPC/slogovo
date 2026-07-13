import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseSyncBatch } from "@/lib/sync-schema";
import { persistSyncEvents } from "@/lib/sync-server";
import { logError } from "@/lib/structured-log";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const events = parseSyncBatch(await request.json());
    const result = await persistSyncEvents(
      supabase,
      user.id,
      events
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Ungültige Synchronisationsdaten", issues: error.issues },
        { status: 400 }
      );
    }
    logError("sync.request_failed", error);
    return NextResponse.json(
      { error: "Synchronisation fehlgeschlagen" },
      { status: 500 }
    );
  }
}
