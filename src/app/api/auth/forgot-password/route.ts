import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { forgotPasswordSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
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

    // Send password reset email via Supabase Auth
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.toLowerCase(),
      {
        redirectTo: `${process.env.NEXTAUTH_URL}/reset-password`,
      }
    );

    if (error) {
      console.error("Supabase reset error:", error);
    }

    // Don't reveal if user exists
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
