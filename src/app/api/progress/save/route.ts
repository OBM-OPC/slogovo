import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UserProgress } from "@/types";
import { mergeProgress } from "@/lib/progress-merge";
import { progressToRow, rowToProgress } from "@/lib/progress-serialization";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const body = (await request.json()) as { progress?: UserProgress };
    const progress = body.progress;

    if (!progress || progress.userId !== user.id) {
      return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
    }

    const { data: existing, error: loadError } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (loadError) {
      return NextResponse.json(
        { error: "Fehler beim Zusammenführen", details: loadError.message },
        { status: 500 }
      );
    }

    const remote = rowToProgress(existing as Record<string, unknown> | null, user.id);
    const merged = remote ? mergeProgress(progress, remote) : progress;
    const { error } = await supabase
      .from("user_progress")
      .upsert(
        {
          ...progressToRow(merged),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      return NextResponse.json(
        { error: "Fehler beim Speichern", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, progress: merged }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten", details: message },
      { status: 500 }
    );
  }
}
