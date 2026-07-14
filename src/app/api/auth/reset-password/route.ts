import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resetPasswordSchema } from "@/lib/validations";
import { logEvent } from "@/lib/structured-log";
import { readJsonBody, RequestBodyError } from "@/lib/request-security";
import { ipIdentity } from "@/lib/rate-limit";
import { RATE_LIMITS, rateLimitClient, rateLimitRequest } from "@/lib/api-protection";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request, 8 * 1024) as Record<string, unknown>;

    const { token, password } = body;
    if (!token) {
      logEvent("auth_failure", { errorCode: "AUTH_REJECTED", reason: "missing_reset_token" });
      return NextResponse.json(
        { error: "Token ist erforderlich" },
        { status: 400 }
      );
    }

    const result = resetPasswordSchema.safeParse({
      password,
      confirmPassword: password,
    });
    if (!result.success) {
      logEvent("auth_failure", { errorCode: "AUTH_REJECTED", reason: "validation" });
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const limited = await rateLimitRequest(rateLimitClient(supabase), request, [
      { identity: ipIdentity(request), rule: RATE_LIMITS.resetIp },
      { identity: `token:${String(token).slice(0, 24)}`, rule: RATE_LIMITS.resetIp },
    ]);
    if (limited) return limited;

    const { error } = await supabase.auth.verifyOtp({
      token_hash: String(token),
      type: "recovery",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login`,
      },
    });

    if (error) {
      logEvent("auth_failure", { errorCode: "AUTH_REJECTED", reason: "invalid_reset_token" });
      return NextResponse.json(
        { error: "Ungültiger oder abgelaufener Token" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: result.data.password });

    if (updateError) {
      logEvent("auth_failure", { errorCode: "AUTH_REJECTED", reason: "password_update_rejected" });
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Passwort erfolgreich zurückgesetzt" },
      { status: 200 }
    );
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
