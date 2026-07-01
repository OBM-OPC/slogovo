import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({ message: "Logout erfolgreich" }, { status: 200 });

    const secureCookie = process.env.NODE_ENV === "production";

    response.cookies.set("sb-session", "", {
      httpOnly: true,
      secure: secureCookie,
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    response.cookies.set("sb-token", "", {
      httpOnly: false,
      secure: secureCookie,
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
