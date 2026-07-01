import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { loginSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });

    if (authError || !authData.session) {
      return NextResponse.json(
        { error: "Ungültige E-Mail-Adresse oder Passwort" },
        { status: 401 }
      );
    }

    const response = NextResponse.json(
      {
        message: "Login erfolgreich",
        user: {
          id: authData.user?.id,
          email: authData.user?.email,
          name: authData.user?.user_metadata?.name || null,
        },
      },
      { status: 200 }
    );

    const secureCookie = process.env.NODE_ENV === "production";

    response.cookies.set("sb-session", JSON.stringify(authData.session), {
      httpOnly: true,
      secure: secureCookie,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    // Also set a non-httpOnly cookie for browser-side Supabase client
    response.cookies.set("sb-token", JSON.stringify({
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
    }), {
      httpOnly: false,
      secure: secureCookie,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut." },
      { status: 500 }
    );
  }
}
