import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export async function POST() {
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();

    // Clear the cookie
    const cookieStore = await cookies();
    cookieStore.set("sb-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return NextResponse.json({ message: "Logout erfolgreich" }, { status: 200 });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
