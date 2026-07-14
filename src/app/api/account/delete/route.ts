import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: "Kontolöschung ist serverseitig noch nicht konfiguriert", code: "ACCOUNT_ADMIN_UNAVAILABLE" },
        { status: 503 }
      );
    }
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) return NextResponse.json({ error: "Konto konnte nicht gelöscht werden" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json({ error: "Ungültige Anfrage", code: error.code }, { status: error.code === "BODY_TOO_LARGE" ? 413 : 400 });
    }
    return NextResponse.json({ error: "Konto konnte nicht gelöscht werden" }, { status: 500 });
  }
}
