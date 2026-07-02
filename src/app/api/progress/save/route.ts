import { NextRequest, NextResponse } from "next/server";
import { UserProgress } from "@/types";
import { authenticateRequest, getSupabaseServer, jsonWithAuthCookies } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.user) {
      return NextResponse.json({ error: auth.error || "Nicht authentifiziert" }, { status: auth.status });
    }

    const supabaseServer = getSupabaseServer();
    const body = await request.json() as { progress?: UserProgress };
    const progress = body.progress;

    if (!progress || progress.userId !== auth.user.id) {
      return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
    }

    const { userId, ...rest } = progressToRow(progress);
    const { error } = await supabaseServer
      .from("user_progress")
      .upsert(
        {
          user_id: userId,
          ...rest,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      return NextResponse.json({ error: "Fehler beim Speichern", details: error.message }, { status: 500 });
    }

    return jsonWithAuthCookies({ success: true }, auth, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Ein Fehler ist aufgetreten", details: message }, { status: 500 });
  }
}

function progressToRow(progress: UserProgress) {
  return {
    userId: progress.userId,
    streak_current: progress.streak?.current ?? 0,
    streak_longest: progress.streak?.longest ?? 0,
    streak_last_study_date: progress.streak?.lastStudyDate ?? null,
    completed_lessons: progress.completedLessons ?? [],
    completed_modules: progress.completedModules ?? [],
    vocabulary_progress: progress.vocabularyProgress ?? {},
    exercise_stats: progress.exerciseStats ?? { total: 0, correct: 0, wrong: 0, consecutiveCorrect: 0 },
    daily_stats: progress.dailyStats ?? {},
    settings: progress.settings ?? {
      dailyGoal: "medium",
      ttsEnabled: true,
      showLatin: true,
      speechRate: 0.9,
    },
    achievements: progress.achievements ?? [],
  };
}
