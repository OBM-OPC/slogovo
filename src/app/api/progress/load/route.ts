import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, getSupabaseServer, jsonWithAuthCookies } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.user) {
      return NextResponse.json({ error: auth.error || "Nicht authentifiziert" }, { status: auth.status });
    }

    const supabaseServer = getSupabaseServer();
    const { data, error } = await supabaseServer
      .from("user_progress")
      .select("*")
      .eq("user_id", auth.user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Progress load error:", error);
      return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
    }

    return jsonWithAuthCookies({ progress: data || null }, auth, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Progress load error:", error);
    return NextResponse.json({ error: "Ein Fehler ist aufgetreten", details: message }, { status: 500 });
  }
}
