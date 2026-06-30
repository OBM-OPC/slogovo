import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) {
    throw new Error(`Missing Supabase config: URL=${!!url}, KEY=${!!key}`);
  }
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getSessionFromCookie(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie") || "";
  const sessionMatch = cookieHeader.match(/sb-session=([^;]+)/);
  const sessionCookie = sessionMatch ? decodeURIComponent(sessionMatch[1]) : null;
  if (!sessionCookie) return null;
  try {
    return JSON.parse(sessionCookie);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromCookie(request);
    if (!session?.access_token) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const supabaseServer = getSupabaseServer();
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser(session.access_token);

    if (userError || !user) {
      return NextResponse.json({ error: "Ungültige Session" }, { status: 401 });
    }

    const { data, error } = await supabaseServer
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Progress load error:", error);
      return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
    }

    return NextResponse.json({ progress: data || null }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Progress load error:", error);
    return NextResponse.json({ error: "Ein Fehler ist aufgetreten", details: message }, { status: 500 });
  }
}
