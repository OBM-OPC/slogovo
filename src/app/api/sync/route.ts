import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseSyncBatch } from "@/lib/sync-schema";
import { persistSyncEvents } from "@/lib/sync-server";
import { logEvent } from "@/lib/structured-log";
import { readJsonBody, RequestBodyError } from "@/lib/request-security";
import { ipIdentity } from "@/lib/rate-limit";
import { RATE_LIMITS, rateLimitClient, rateLimitRequest } from "@/lib/api-protection";
import { rebuildAuthoritativeProgress } from "@/lib/authoritative-progress-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const limited = await rateLimitRequest(rateLimitClient(supabase), request, [
      { identity: ipIdentity(request), rule: RATE_LIMITS.syncIp },
      { identity: `user:${user.id}`, rule: RATE_LIMITS.syncUser },
    ]);
    if (limited) return limited;

    const events = parseSyncBatch(await readJsonBody(request, 512 * 1024));
    const result = await persistSyncEvents(
      supabase,
      user.id,
      events
    );
    const progress = await rebuildAuthoritativeProgress(supabase, user.id);
    return NextResponse.json({ ...result, progress });
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json(
        { error: "Ungültige Synchronisationsdaten", code: error.code },
        { status: error.code === "BODY_TOO_LARGE" ? 413 : 400 }
      );
    }
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Ungültige Synchronisationsdaten", issues: error.issues },
        { status: 400 }
      );
    }
    logEvent("sync_failure", { errorCode: "SYNC_TRANSPORT_FAILED", reason: "server" });
    return NextResponse.json(
      { error: "Synchronisation fehlgeschlagen" },
      { status: 500 }
    );
  }
}
