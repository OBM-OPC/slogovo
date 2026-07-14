import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validations";
import { sendWelcomeEmail } from "@/lib/email";
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

    const result = registerSchema.safeParse(body);
    if (!result.success) {
      logEvent("auth_failure", { errorCode: "AUTH_REJECTED", reason: "validation" });
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;
    const supabase = await createClient();
    const limited = await rateLimitRequest(rateLimitClient(supabase), request, [
      { identity: ipIdentity(request), rule: RATE_LIMITS.registerIp },
    ]);
    if (limited) return limited;

    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        data: { name: name || null },
      },
    });

    if (error) {
      logEvent("auth_failure", { errorCode: "AUTH_REJECTED", reason: "registration_rejected" });
    }

    // Supabase may intentionally return an obfuscated user for an existing
    // address. Only a newly created identity receives a welcome message.
    if (!error && data.user?.identities && data.user.identities.length > 0) {
      sendWelcomeEmail(email, name || undefined).catch(() => {
        logEvent("auth_failure", { errorCode: "WELCOME_EMAIL_FAILED", reason: "delivery" });
      });
    }

    await minimumResponseTime(startedAt);
    return NextResponse.json(
      {
        message: "Falls für diese E-Mail noch kein Konto besteht, erhältst du weitere Anweisungen.",
      },
      { status: 202 }
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
