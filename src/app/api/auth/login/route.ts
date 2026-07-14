import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations";
import { logEvent } from "@/lib/structured-log";
import { readJsonBody, RequestBodyError } from "@/lib/request-security";
import { ipIdentity } from "@/lib/rate-limit";
import { RATE_LIMITS, rateLimitClient, rateLimitRequest } from "@/lib/api-protection";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request, 8 * 1024);

    const result = loginSchema.safeParse(body);
    if (!result.success) {
      logEvent("auth_failure", { errorCode: "AUTH_REJECTED", reason: "validation" });
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    const supabase = await createClient();
    const limited = await rateLimitRequest(rateLimitClient(supabase), request, [
      { identity: ipIdentity(request), rule: RATE_LIMITS.loginIp },
      { identity: `email:${email}`, rule: RATE_LIMITS.loginEmail },
    ]);
    if (limited) return limited;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });

    if (error || !data.session) {
      logEvent("auth_failure", { errorCode: "AUTH_REJECTED", reason: "invalid_credentials" });
      return NextResponse.json(
        { error: "Ungültige E-Mail-Adresse oder Passwort" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: "Login erfolgreich",
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || null,
      },
    });
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json(
        { error: "Ungültige Anfrage", code: error.code },
        { status: error.code === "BODY_TOO_LARGE" ? 413 : 400 }
      );
    }
    logEvent("auth_failure", { errorCode: "AUTH_SERVER_ERROR", reason: "server" });
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut." },
      { status: 500 }
    );
  }
}
