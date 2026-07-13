import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validations";
import { sendWelcomeEmail } from "@/lib/email";
import { logEvent } from "@/lib/structured-log";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = registerSchema.safeParse(body);
    if (!result.success) {
      logEvent("auth_failure", { errorCode: "AUTH_REJECTED", reason: "validation" });
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        data: { name: name || null },
      },
    });

    if (error) {
      logEvent("auth_failure", { errorCode: "AUTH_REJECTED", reason: "registration_rejected" });
      // Supabase returns a user-friendly message; map duplicate/sign-up errors.
      const isDuplicate =
        error.message.toLowerCase().includes("already registered") ||
        error.message.toLowerCase().includes("already exists");
      return NextResponse.json(
        { error: isDuplicate ? "Ein Benutzer mit dieser E-Mail-Adresse existiert bereits" : error.message },
        { status: isDuplicate ? 409 : 400 }
      );
    }

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, name || undefined).catch(console.error);

    return NextResponse.json(
      {
        message: "Registrierung erfolgreich",
        user: data.user
          ? {
              id: data.user.id,
              email: email.toLowerCase(),
              name: name || null,
            }
          : null,
      },
      { status: 201 }
    );
  } catch {
    logEvent("auth_failure", { errorCode: "AUTH_SERVER_ERROR", reason: "server" });
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut." },
      { status: 500 }
    );
  }
}
