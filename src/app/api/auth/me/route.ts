import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, jsonWithAuthCookies } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.user) {
      return NextResponse.json({ error: auth.error || "Nicht authentifiziert" }, { status: auth.status });
    }

    return jsonWithAuthCookies(
      {
        user: {
          id: auth.user.id,
          email: auth.user.email,
          name: auth.user.user_metadata?.name || null,
          image: auth.user.user_metadata?.avatar_url || null,
          displayName: auth.user.user_metadata?.display_name || null,
          bio: auth.user.user_metadata?.bio || null,
          createdAt: auth.user.created_at,
        },
      },
      auth,
      { status: 200 }
    );
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
