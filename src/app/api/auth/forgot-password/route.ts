import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { forgotPasswordSchema } from "@/lib/validations";
import { logEvent } from "@/lib/structured-log";
import { readJsonBody, RequestBodyError } from "@/lib/request-security";
import { ipIdentity } from "@/lib/rate-limit";
import { RATE_LIMITS, rateLimitClient, rateLimitRequest } from "@/lib/api-protection";
import { minimumResponseTime } from "@/lib/timing";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    const body = await readJsonBody(request, 8 * 1024);

    const result = forgotPasswordSchema.safeParse(body);
    if (!result.success) {
      logEvent("auth_failure", { errorCode: "AUTH_REJECTED", reason: "validation" });
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const supabase = await createClient();
    const limited = await rateLimitRequest(rateLimitClient(supabase), request, [
      { identity: ipIdentity(request), rule: RATE_LIMITS.forgotIp },
      { identity: `email:${email}`, rule: RATE_LIMITS.forgotEmail },
    ]);
    if (limited) return limited;

    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password`,
    });

    if (error) {
      logEvent("auth_failure", { errorCode: "AUTH_REJECTED", reason: "reset_request_rejected" });
    }

    // Don't reveal if user exists.
    await minimumResponseTime(startedAt);
    return NextResponse.json(
      { message: "Falls für diese E-Mail noch kein Konto besteht, erhältst du weitere Anweisungen." },
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
