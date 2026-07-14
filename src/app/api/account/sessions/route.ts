import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  return NextResponse.json({
    sessions: [{
      id: "current",
      current: true,
      lastAuthenticatedAt: user.last_sign_in_at ?? null,
    }],
    detail: "Supabase exposes the current session to the application; other sessions can be revoked without exposing their tokens.",
  });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  const { error } = await supabase.auth.signOut({ scope: "others" });
  if (error) return NextResponse.json({ error: "Andere Sitzungen konnten nicht widerrufen werden" }, { status: 500 });
  return NextResponse.json({ success: true });
}
