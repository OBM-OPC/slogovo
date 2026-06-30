import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const sessionMatch = cookieHeader.match(/sb-session=([^;]+)/);
    const sessionCookie = sessionMatch ? decodeURIComponent(sessionMatch[1]) : null;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: { user }, error } = await supabase.auth.getUser(session.access_token);

    if (error || !user) {
      return NextResponse.json({ error: "Ungültige Session" }, { status: 401 });
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || null,
          image: user.user_metadata?.avatar_url || null,
          displayName: user.user_metadata?.display_name || null,
          bio: user.user_metadata?.bio || null,
          createdAt: user.created_at,
        },
      },
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
