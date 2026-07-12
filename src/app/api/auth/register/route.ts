import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validations";
import { sendWelcomeEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = registerSchema.safeParse(body);
    if (!result.success) {
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
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut." },
      { status: 500 }
    );
  }
}
