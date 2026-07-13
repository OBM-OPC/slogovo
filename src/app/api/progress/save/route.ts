import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UserProgress } from "@/types";

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

    const { userId, ...rest } = progressToRow(progress);
    const { error } = await supabase
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
      return NextResponse.json(
        { error: "Fehler beim Speichern", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten", details: message },
      { status: 500 }
    );
  }
}

function progressToRow(progress: UserProgress) {
  return {
    userId: progress.userId,
    streak_current: progress.streak?.current ?? 0,
    streak_longest: progress.streak?.longest ?? 0,
    streak_last_study_date: progress.streak?.lastStudyDate ?? null,
    completed_lessons: progress.completedLessons ?? [],
    mastered_lessons: ((progress as unknown) as Record<string, unknown>).masteredLessons ?? [],
    completed_modules: progress.completedModules ?? [],
    vocabulary_progress: progress.vocabularyProgress ?? {},
    lesson_scores: ((progress as unknown) as Record<string, unknown>).lessonScores ?? {},
    exercise_stats: progress.exerciseStats ?? {
      total: 0,
      correct: 0,
      wrong: 0,
      consecutiveCorrect: 0,
    },
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
