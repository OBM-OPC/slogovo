import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createDefaultProgress } from "@/lib/progress-db";
import { rowToProgress } from "@/lib/progress-serialization";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json(
        { error: "Fehler beim Laden", details: error.message },
        { status: 500 }
      );
    }

    const progress = data
      ? rowToProgress(data as Record<string, unknown>, user.id)
      : createDefaultProgress(user.id);

    return NextResponse.json({ progress }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten", details: message },
      { status: 500 }
    );
  }
}
