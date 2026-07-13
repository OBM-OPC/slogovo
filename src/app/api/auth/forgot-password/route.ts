import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { forgotPasswordSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = forgotPasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password`,
    });

    if (error) {
      console.error("Supabase reset error:", error);
    }

    // Don't reveal if user exists.
    return NextResponse.json(
      { message: "Wenn ein Konto existiert, wurde eine E-Mail gesendet" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut." },
      { status: 500 }
    );
  }
}
