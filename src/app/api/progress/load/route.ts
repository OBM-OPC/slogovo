import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UserProgress } from "@/types";
import { createDefaultProgress } from "@/lib/progress-db";

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

function rowToProgress(row: Record<string, unknown>, userId: string): UserProgress {
  return {
    userId,
    streak: {
      current: Number(row.streak_current ?? 0),
      longest: Number(row.streak_longest ?? 0),
      lastStudyDate: (row.streak_last_study_date as string | undefined) ?? undefined,
    },
    completedLessons: (row.completed_lessons as string[] | undefined) ?? [],
    masteredLessons: (row.mastered_lessons as string[] | undefined) ?? [],
    completedModules: (row.completed_modules as string[] | undefined) ?? [],
    vocabularyProgress: (row.vocabulary_progress as UserProgress["vocabularyProgress"] | undefined) ?? {},
    lessonScores: (row.lesson_scores as Record<string, number> | undefined) ?? {},
    exerciseStats: (row.exercise_stats as UserProgress["exerciseStats"] | undefined) ?? {
      total: 0,
      correct: 0,
      wrong: 0,
      consecutiveCorrect: 0,
    },
    dailyStats: (row.daily_stats as UserProgress["dailyStats"] | undefined) ?? {},
    recordedAttemptIds: (row.recorded_attempt_ids as string[] | undefined) ?? [],
    settings: (row.settings as UserProgress["settings"] | undefined) ?? {
      dailyGoal: "medium",
      ttsEnabled: true,
      showLatin: true,
      speechRate: 0.9,
    },
    achievements: (row.achievements as string[] | undefined) ?? [],
  };
}
