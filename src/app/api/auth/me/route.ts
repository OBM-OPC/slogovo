import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("sb-session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie);

    // Create a fresh Supabase client with the user's session
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

    supabase.auth.setSession(session);

    const { data: { user }, error } = await supabase.auth.getUser();

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
