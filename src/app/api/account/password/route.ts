import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { changePasswordSchema } from "@/lib/account-security";
import { readJsonBody, RequestBodyError } from "@/lib/request-security";
import { RATE_LIMITS, rateLimitClient, rateLimitRequest } from "@/lib/api-protection";
import { ipIdentity } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.email) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    const limited = await rateLimitRequest(rateLimitClient(supabase), request, [
      { identity: ipIdentity(request), rule: RATE_LIMITS.accountSensitive },
      { identity: `user:${user.id}`, rule: RATE_LIMITS.accountSensitive },
    ]);
    if (limited) return limited;
    const parsed = changePasswordSchema.safeParse(await readJsonBody(request, 8 * 1024));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const { error: reauthError } = await supabase.auth.signInWithPassword({ email: user.email, password: parsed.data.currentPassword });
    if (reauthError) return NextResponse.json({ error: "Aktuelles Passwort ist ungültig" }, { status: 403 });
    const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
    if (error) return NextResponse.json({ error: "Passwort konnte nicht geändert werden" }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof RequestBodyError) return NextResponse.json({ error: "Ungültige Anfrage", code: error.code }, { status: error.code === "BODY_TOO_LARGE" ? 413 : 400 });
    return NextResponse.json({ error: "Passwort konnte nicht geändert werden" }, { status: 500 });
  }
}
