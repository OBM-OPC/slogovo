import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sb-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ error: "Ungültiger Token" }, { status: 401 });
    }

    // Get additional user data from public.users table
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: userData?.name || user.user_metadata?.name || null,
          image: userData?.image || null,
          displayName: userData?.display_name || null,
          bio: userData?.bio || null,
          createdAt: userData?.created_at || user.created_at,
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
