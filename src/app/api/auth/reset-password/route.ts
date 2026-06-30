import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { resetPasswordSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { token, password } = body;

    if (!token) {
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
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    // Verify the token and update password with Supabase Auth
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: "recovery",
      options: {
        redirectTo: `${process.env.NEXTAUTH_URL}/login`,
      },
    });

    if (error) {
      return NextResponse.json(
        { error: "Ungültiger oder abgelaufener Token" },
        { status: 400 }
      );
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
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
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut." },
      { status: 500 }
    );
  }
}
